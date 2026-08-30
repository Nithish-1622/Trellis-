"""Durable Postgres job orchestration and automated discovery execution."""

from datetime import datetime, timedelta
import hashlib
import logging
import re
from typing import Protocol
import uuid

from sqlalchemy import and_, or_, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config import settings
from database import (
    LearnerGoalSkill,
    LearningResource,
    ResourceEvaluation,
    ResourceInteraction,
    ResourceSignalSummary,
    ResourceJob,
    ResourceSkillMap,
    Skill,
    UserProfile,
)
from goal_skill_planner import GoalSkillService
from resource_coverage import ResourceCoverageService
from resource_providers import CreatorMetrics, ExternalResource, ProviderSearchRequest, ResourceMetrics, ResourceProvider
from resource_vetting import EvaluationResult, ResourceVettingService, VettingContext


logger = logging.getLogger(__name__)


class Vetter(Protocol):
    async def evaluate(self, candidate: ExternalResource, context: VettingContext) -> EvaluationResult: ...


class ResourceJobService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def enqueue_discovery(self, user_id: str, profile_version: int) -> ResourceJob:
        dedupe_key = f"{user_id}:profile:{profile_version}:discovery-v1"
        existing = self.db.query(ResourceJob).filter_by(job_type="discovery", dedupe_key=dedupe_key).first()
        if existing:
            return existing
        job = ResourceJob(
            id=str(uuid.uuid4()), user_id=user_id, job_type="discovery", dedupe_key=dedupe_key,
            status="queued", payload={"profile_version": profile_version}, result={}, progress=0,
            attempts=0, max_attempts=settings.RESOURCE_JOB_MAX_ATTEMPTS, run_at=datetime.utcnow(),
        )
        self.db.add(job)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            return self.db.query(ResourceJob).filter_by(job_type="discovery", dedupe_key=dedupe_key).one()
        self.db.refresh(job)
        return job

    def enqueue_evaluation(self, resource_id: str, reason: str) -> ResourceJob:
        bucket = datetime.utcnow().strftime("%Y-%m-%d")
        dedupe_key = f"{resource_id}:evaluation:{bucket}"
        existing = self.db.query(ResourceJob).filter_by(job_type="evaluation", dedupe_key=dedupe_key).first()
        if existing:
            return existing
        job = ResourceJob(
            id=str(uuid.uuid4()), job_type="evaluation", dedupe_key=dedupe_key, status="queued",
            payload={"resource_id": resource_id, "reason": reason[:100]}, result={}, progress=0,
            attempts=0, max_attempts=settings.RESOURCE_JOB_MAX_ATTEMPTS, run_at=datetime.utcnow(),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def claim_next(self, worker_id: str) -> ResourceJob | None:
        now = datetime.utcnow()
        job = self.db.query(ResourceJob).filter(
            ResourceJob.status == "queued", ResourceJob.run_at <= now,
        ).order_by(ResourceJob.run_at, ResourceJob.created_at).with_for_update(skip_locked=True).first()
        if job is None:
            return None
        job.status = "running"
        job.locked_at = now
        job.locked_by = worker_id[:100]
        job.attempts += 1
        job.updated_at = now
        self.db.commit()
        self.db.refresh(job)
        return job

    def fail(self, job: ResourceJob, error_code: str) -> None:
        now = datetime.utcnow()
        job.last_error_code = re.sub(r"[^A-Z0-9_]", "_", error_code.upper())[:80]
        job.locked_at = None
        job.locked_by = None
        job.updated_at = now
        if job.attempts >= job.max_attempts:
            job.status = "dead"
            job.completed_at = now
        else:
            job.status = "queued"
            job.run_at = now + timedelta(seconds=min(2 ** job.attempts * 5, 300))
        self.db.commit()

    def enqueue_scheduled_maintenance(self, job_type: str, dedupe_key: str, payload: dict) -> ResourceJob | None:
        if self.db.bind and self.db.bind.dialect.name == "postgresql":
            locked = self.db.execute(text("SELECT pg_try_advisory_xact_lock(hashtext(:key))"), {"key": f"trellis:{job_type}:{dedupe_key}"}).scalar()
            if not locked:
                self.db.rollback()
                return None
        existing = self.db.query(ResourceJob).filter_by(job_type=job_type, dedupe_key=dedupe_key).first()
        if existing:
            self.db.commit()
            return existing
        job = ResourceJob(
            id=str(uuid.uuid4()), job_type=job_type, dedupe_key=dedupe_key, status="queued", payload=payload,
            result={}, progress=0, attempts=0, max_attempts=settings.RESOURCE_JOB_MAX_ATTEMPTS,
            run_at=datetime.utcnow(),
        )
        self.db.add(job)
        self.db.commit()
        return job

    def schedule_recurring(self) -> int:
        """Schedule bounded cleanup and reevaluation work; DB uniqueness prevents duplicates."""
        now = datetime.utcnow()
        scheduled = 0
        cleanup = self.enqueue_scheduled_maintenance(
            "interaction_cleanup", now.strftime("interaction-cleanup:%Y-%m-%d"), {},
        )
        scheduled += int(cleanup is not None and cleanup.status == "queued")
        candidates = self.db.query(LearningResource).join(
            ResourceSkillMap, ResourceSkillMap.resource_id == LearningResource.id
        ).outerjoin(
            ResourceSignalSummary, ResourceSignalSummary.resource_id == LearningResource.id
        ).filter(
            LearningResource.verification_status.in_(["verified", "vetted", "discovered"]),
            LearningResource.archived_at.is_(None),
            or_(
                LearningResource.last_evaluated_at.is_(None),
                and_(LearningResource.freshness_class == "fast_moving", LearningResource.last_evaluated_at < now - timedelta(days=7)),
                and_(LearningResource.freshness_class == "moderate", LearningResource.last_evaluated_at < now - timedelta(days=30)),
                and_(LearningResource.freshness_class == "stable", LearningResource.last_evaluated_at < now - timedelta(days=90)),
                ResourceSignalSummary.impressions >= 100,
            ),
        ).distinct().order_by(LearningResource.last_evaluated_at.asc()).limit(settings.RESOURCE_REEVALUATION_BATCH_SIZE).all()
        for resource in candidates:
            job = self.enqueue_evaluation(resource.id, "scheduled_freshness_or_usage")
            scheduled += int(job.status == "queued")
        return scheduled


class ResourceDiscoveryService:
    def __init__(self, db: Session, provider: ResourceProvider, vetter: Vetter | None = None) -> None:
        self.db = db
        self.provider = provider
        self.vetter = vetter or ResourceVettingService()

    async def run(self, job: ResourceJob) -> ResourceJob:
        if job.job_type != "discovery" or job.status != "running" or not job.user_id:
            raise ValueError("A claimed learner discovery job is required")
        profile = self.db.get(UserProfile, job.user_id)
        version = int((job.payload or {}).get("profile_version", 0))
        if profile is None or profile.profile_version != version:
            ResourceJobService(self.db).fail(job, "PROFILE_VERSION_STALE")
            return job
        GoalSkillService(self.db).persist(profile)
        gaps = ResourceCoverageService(self.db).uncovered(job.user_id, version)
        total = max(min(len(gaps), settings.RESOURCE_DISCOVERY_SKILL_LIMIT), 1)
        discovered = vetted = rejected = 0
        failed_skills: list[str] = []
        for index, gap in enumerate(gaps[:settings.RESOURCE_DISCOVERY_SKILL_LIMIT], start=1):
            requirement = self.db.get(LearnerGoalSkill, gap.goal_skill_id)
            if requirement is None:
                continue
            request = ProviderSearchRequest(
                skill=gap.skill, target_level=requirement.target_level, objective=profile.objective,
                language=profile.preferred_language or "English", resource_intent=requirement.resource_intent,
            )
            try:
                candidates = await self.provider.search(request, settings.RESOURCE_DISCOVERY_PROVIDER_LIMIT)
            except Exception as exc:
                logger.warning("Discovery provider failed for a skill: %s", type(exc).__name__)
                failed_skills.append(gap.skill)
                candidates = []
            if not candidates:
                failed_skills.append(gap.skill)
            for candidate in candidates:
                if self._conceptual_duplicate(candidate):
                    continue
                resource = self._upsert_candidate(candidate)
                try:
                    evaluation = await self.vetter.evaluate(candidate, VettingContext(
                        skill=gap.skill, target_level=requirement.target_level, objective=profile.objective,
                        freshness_class=self._freshness_class(gap.skill),
                    ))
                except Exception as exc:
                    logger.warning("Resource vetting failed: %s", type(exc).__name__)
                    discovered += 1
                    continue
                self._persist_evaluation(resource, gap.skill_id, evaluation)
                if evaluation.status == "vetted":
                    vetted += 1
                elif evaluation.status == "rejected":
                    rejected += 1
                else:
                    discovered += 1
            job.progress = min(round(index / total * 100), 99)
            job.updated_at = datetime.utcnow()
            self.db.commit()

        coverage = ResourceCoverageService(self.db).analyze(job.user_id, version)
        job.status = "completed"
        job.progress = 100
        job.result = {
            "profile_version": version,
            "discovered": discovered,
            "vetted": vetted,
            "rejected": rejected,
            "coverage": [item.model_dump() for item in coverage],
            "coverage_gaps": [item.skill for item in coverage if not item.covered],
            "provider_gaps": list(dict.fromkeys(failed_skills)),
        }
        job.last_error_code = None
        job.locked_at = None
        job.locked_by = None
        job.completed_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(job)
        return job

    async def reevaluate(self, job: ResourceJob) -> ResourceJob:
        if job.job_type != "evaluation" or job.status != "running":
            raise ValueError("A claimed evaluation job is required")
        resource = self.db.get(LearningResource, (job.payload or {}).get("resource_id"))
        if resource is None:
            ResourceJobService(self.db).fail(job, "RESOURCE_NOT_FOUND")
            return job
        metadata = resource.resource_metadata or {}
        candidate = ExternalResource(
            provider=resource.provider, external_id=resource.external_id or resource.id,
            canonical_key=resource.canonical_key, resource_type=resource.resource_type,
            title=resource.title, description=resource.description, url=resource.url,
            thumbnail_url=resource.thumbnail_url, author=resource.author, published_at=resource.published_at,
            duration_seconds=resource.duration_seconds, topics=resource.topics or [], language=resource.language,
            metrics=ResourceMetrics.model_validate(metadata.get("provider_metrics") or {}),
            creator_metrics=CreatorMetrics.model_validate(metadata.get("creator_metrics") or {}), metadata=metadata,
        )
        mappings = self.db.query(ResourceSkillMap, Skill).join(Skill, ResourceSkillMap.skill_id == Skill.id).filter(
            ResourceSkillMap.resource_id == resource.id
        ).order_by(ResourceSkillMap.relevance_score.desc()).all()
        if not mappings:
            job.status = "dead"
            job.last_error_code = "RESOURCE_SKILL_MISSING"
        else:
            for mapping, skill in mappings:
                evaluation = await self.vetter.evaluate(candidate, VettingContext(
                    skill=skill.display_name, freshness_class=self._freshness_class(skill.display_name),
                ))
                self._persist_evaluation(resource, skill.id, evaluation)
            job.status = "completed"
            job.last_error_code = None
            job.result = {"resource_id": resource.id, "score": resource.resource_score, "status": resource.verification_status}
        job.progress = 100
        job.locked_at = None
        job.locked_by = None
        job.completed_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(job)
        return job

    def cleanup_interactions(self, job: ResourceJob) -> ResourceJob:
        cutoff = datetime.utcnow() - timedelta(days=settings.RESOURCE_INTERACTION_RETENTION_DAYS)
        deleted = self.db.query(ResourceInteraction).filter(ResourceInteraction.created_at < cutoff).delete(synchronize_session=False)
        job.status = "completed"
        job.progress = 100
        job.result = {"deleted_interactions": deleted, "retention_days": settings.RESOURCE_INTERACTION_RETENTION_DAYS}
        job.locked_at = None
        job.locked_by = None
        job.completed_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        self.db.commit()
        return job

    def _upsert_candidate(self, candidate: ExternalResource) -> LearningResource:
        resource = self.db.query(LearningResource).filter_by(canonical_key=candidate.canonical_key).first()
        if resource is None:
            resource = LearningResource(id=str(uuid.uuid4()), canonical_key=candidate.canonical_key)
            self.db.add(resource)
        elif resource.verification_status == "verified":
            # Provider discovery may refresh score evidence, but a remote payload must
            # never replace content that a human explicitly reviewed and trusted.
            self.db.flush()
            return resource
        resource.provider = candidate.provider
        resource.external_id = candidate.external_id
        resource.resource_type = candidate.resource_type
        resource.title = candidate.title
        resource.description = candidate.description
        resource.url = str(candidate.url)
        resource.thumbnail_url = str(candidate.thumbnail_url) if candidate.thumbnail_url else None
        resource.author = candidate.author
        resource.published_at = candidate.published_at
        resource.duration_seconds = candidate.duration_seconds
        resource.duration_minutes = round(candidate.duration_seconds / 60) if candidate.duration_seconds else None
        resource.topics = candidate.topics
        resource.language = candidate.language
        resource.verification_status = resource.verification_status if resource.verification_status == "verified" else "discovered"
        resource.link_status = "healthy"
        metadata = {key: value for key, value in candidate.metadata.items() if key not in {"readme", "transcript", "text"}}
        if candidate.metadata.get("readme"):
            metadata["readme_hash"] = hashlib.sha256(candidate.metadata["readme"].encode("utf-8")).hexdigest()
        metadata["provider_metrics"] = candidate.metrics.model_dump(mode="json", exclude_none=True)
        metadata["creator_metrics"] = candidate.creator_metrics.model_dump(mode="json", exclude_none=True)
        resource.resource_metadata = metadata
        resource.updated_at = datetime.utcnow()
        self.db.flush()
        return resource

    def _persist_evaluation(self, resource: LearningResource, skill_id: str, evaluation: EvaluationResult) -> None:
        self.db.add(ResourceEvaluation(
            id=str(uuid.uuid4()), resource_id=resource.id, evaluation_version=evaluation.score_version,
            relevance_score=evaluation.relevance_score, content_quality_score=evaluation.content_quality_score,
            engagement_score=evaluation.engagement_score, creator_score=evaluation.creator_score,
            freshness_score=evaluation.freshness_score, final_score=evaluation.final_score,
            confidence=evaluation.confidence, model_version=evaluation.model_version,
            input_fingerprint=evaluation.input_fingerprint,
            evidence={
                **evaluation.evidence, "coverage": evaluation.coverage,
                "transcript_available": evaluation.transcript_available,
                "transcript_language": evaluation.transcript_language,
                "transcript_content_hash": evaluation.transcript_content_hash,
            },
            evaluated_at=datetime.utcnow(),
        ))
        mapping = self.db.query(ResourceSkillMap).filter_by(resource_id=resource.id, skill_id=skill_id).first()
        if mapping is None:
            mapping = ResourceSkillMap(id=str(uuid.uuid4()), resource_id=resource.id, skill_id=skill_id)
            self.db.add(mapping)
        mapping.relevance_score = evaluation.relevance_score
        mapping.evidence = {"score_version": evaluation.score_version, "coverage": evaluation.coverage}
        mapping.updated_at = datetime.utcnow()
        if resource.verification_status != "verified":
            resource.verification_status = evaluation.status
        resource.resource_score = evaluation.final_score
        resource.score_confidence = evaluation.confidence
        resource.score_version = evaluation.score_version
        resource.last_evaluated_at = datetime.utcnow()
        self.db.flush()

    def _conceptual_duplicate(self, candidate: ExternalResource) -> bool:
        if self.db.query(LearningResource.id).filter_by(canonical_key=candidate.canonical_key).first():
            return False
        normalized_title = re.sub(r"\W+", " ", candidate.title.casefold()).strip()
        if not normalized_title or not candidate.author:
            return False
        existing = self.db.query(LearningResource).filter(
            LearningResource.author == candidate.author,
            LearningResource.provider == candidate.provider,
        ).all()
        return any(re.sub(r"\W+", " ", item.title.casefold()).strip() == normalized_title for item in existing)

    @staticmethod
    def _freshness_class(skill: str) -> str:
        normalized = skill.casefold()
        if any(term in normalized for term in ("react", "next.js", "openai", "spring boot", "authentication")):
            return "fast_moving"
        if any(term in normalized for term in ("algorithm", "mathematics", "object-oriented", "fundamentals")):
            return "stable"
        return "moderate"
