"""Deterministic skill-gap, prerequisite, scheduling, and resource pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta
import math
import re
import uuid

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from database import (
    LearningActivity,
    LearningHistory,
    LearningResource,
    LearnerGoalSkill,
    ResourceSkillMap,
    Roadmap,
    RoadmapMilestone,
    RoadmapVersion,
    RoadmapResourceAssignment,
    Skill,
)
from config import settings
from errors import APIError
from profile_service import LearnerProfileService
from roadmap_schemas import (
    MilestoneCompletion,
    MilestoneProgressUpdate,
    MilestoneResponse,
    RoadmapCreate,
    RoadmapResponse,
)


ALIASES = {
    "rest api": "api design", "rest apis": "api design", "apis": "api design", "fastapi": "api design",
    "postgresql": "databases", "postgres": "databases", "sql": "databases",
    "pytest": "testing", "unit testing": "testing",
    "containers": "deployment", "docker": "deployment", "kubernetes": "deployment",
}


def canonical_skill_name(name: str) -> str:
    normalized = " ".join(name.casefold().strip().split())
    return ALIASES.get(normalized, normalized)


ROLE_PATHS: dict[str, list[dict]] = {
    "backend": [
        {"key": "python", "title": "Production Python foundations", "skill": "python", "hours": 8, "requires": []},
        {"key": "api-design", "title": "Design reliable service APIs", "skill": "api design", "hours": 10, "requires": ["python"]},
        {"key": "databases", "title": "Model and query production data", "skill": "databases", "hours": 10, "requires": ["python"]},
        {"key": "testing", "title": "Test services with confidence", "skill": "testing", "hours": 8, "requires": ["api-design"]},
        {"key": "deployment", "title": "Deploy and operate a service", "skill": "deployment", "hours": 10, "requires": ["testing", "databases"]},
    ],
    "data": [
        {"key": "python", "title": "Python for data work", "skill": "python", "hours": 8, "requires": []},
        {"key": "statistics", "title": "Applied statistics", "skill": "statistics", "hours": 10, "requires": []},
        {"key": "data-analysis", "title": "Analyze real datasets", "skill": "data analysis", "hours": 12, "requires": ["python", "statistics"]},
        {"key": "machine-learning", "title": "Build and evaluate models", "skill": "machine learning", "hours": 14, "requires": ["data-analysis"]},
    ],
}


def target_path(role: str) -> list[dict]:
    lowered = role.casefold()
    for key, path in ROLE_PATHS.items():
        if key in lowered:
            return path
    return [
        {"key": "foundations", "title": f"Build {role} foundations", "skill": role, "hours": 10, "requires": []},
        {"key": "applied-project", "title": f"Complete an applied {role} project", "skill": f"applied {role}", "hours": 14, "requires": ["foundations"]},
    ]


class RoadmapService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, identity: AuthenticatedUser, request: RoadmapCreate) -> RoadmapResponse:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        if profile.onboarding_completed_at is None:
            raise APIError(status_code=409, code="ONBOARDING_REQUIRED", message="Complete onboarding before generating a roadmap")
        role = request.target_role or profile.target_role
        if not role:
            raise APIError(status_code=422, code="TARGET_ROLE_REQUIRED", message="A target role is required")

        known = {
            canonical_skill_name(item.display_name)
            for item in profile.learner_skills
            if item.proficiency in {"intermediate", "advanced", "expert"}
        }
        for history in self.db.query(LearningHistory).filter(LearningHistory.user_id == identity.user_id):
            known.update(canonical_skill_name(topic) for topic in (history.topics or []))
            known.add(canonical_skill_name(history.title))
        path = self._goal_path(profile) if role == profile.target_role else target_path(role)
        gaps = [item for item in path if canonical_skill_name(item["skill"]) not in known]
        if not gaps:
            gaps = [{"key": "capstone", "title": f"Demonstrate {role} readiness", "skill": f"applied {role}", "hours": 12, "requires": []}]
        gap_keys = {item["key"] for item in gaps}

        self.db.query(Roadmap).filter(Roadmap.user_id == identity.user_id, Roadmap.is_active.is_(True)).update({Roadmap.is_active: False})
        now = datetime.utcnow()
        total_hours = sum(float(item["hours"]) for item in gaps)
        weekly_hours = max(float(profile.weekly_hours or 5), 1)
        weeks = max(1, math.ceil(total_hours / weekly_hours))
        roadmap = Roadmap(
            id=str(uuid.uuid4()), user_id=identity.user_id, target_role=role,
            skill_gaps=[item["skill"] for item in gaps], generated_at=now, last_updated=now,
            estimated_completion_weeks=weeks, is_active=True,
            full_plan={"objective": profile.objective, "pipeline": "deterministic_v1"},
        )
        self.db.add(roadmap)
        self.db.flush()
        version = RoadmapVersion(
            id=str(uuid.uuid4()), roadmap_id=roadmap.id, version_number=1, status="active",
            rationale="Initial roadmap generated from confirmed profile, history, and the verified/vetted resource index.",
            change_summary={"created": [item["key"] for item in gaps]}, created_at=now, activated_at=now,
        )
        self.db.add(version)
        self.db.flush()
        cumulative_hours = 0.0
        for sequence, item in enumerate(gaps, start=1):
            hours = float(item["hours"])
            start = now + timedelta(days=math.floor(cumulative_hours / weekly_hours * 7))
            cumulative_hours += hours
            deadline = now + timedelta(days=max(1, math.ceil(cumulative_hours / weekly_hours * 7)))
            resources = self._resources_for(item["skill"], profile.preferred_language)
            milestone = RoadmapMilestone(
                id=str(uuid.uuid4()), version_id=version.id, stable_key=item["key"], title=item["title"],
                description=f"Build demonstrable proficiency in {item['skill']}.", sequence=sequence,
                prerequisite_keys=[key for key in item["requires"] if key in gap_keys],
                target_skills=[item["skill"]], estimated_hours=hours, scheduled_start=start, deadline=deadline,
                status="not_started", progress_percentage=0, recommended_resources=resources,
                assessment_config={"quiz": {"question_count": 5}, "project": {"provisional_ai_review": True}},
                explanation={
                    "why": f"Your confirmed goal requires {item['skill']}, and current evidence does not yet demonstrate intermediate proficiency.",
                    "confidence": 0.8 if resources else 0.65,
                    "provenance": ["learner_profile", "learning_history", "resource_index"],
                    "alternatives": [],
                },
            )
            self.db.add(milestone)
            self.db.flush()
            for resource_sequence, resource in enumerate(resources, start=1):
                self.db.add(RoadmapResourceAssignment(
                    id=str(uuid.uuid4()), milestone_id=milestone.id, resource_id=resource["id"], sequence=resource_sequence,
                    score_at_assignment=resource.get("score"), confidence_at_assignment=resource.get("confidence"),
                    score_version=resource.get("score_version"), created_at=now,
                ))
        self.db.commit()
        return self.get(identity, roadmap.id)

    def current(self, identity: AuthenticatedUser) -> RoadmapResponse:
        roadmap = self.db.query(Roadmap).filter(Roadmap.user_id == identity.user_id, Roadmap.is_active.is_(True)).order_by(Roadmap.generated_at.desc()).first()
        if roadmap is None:
            raise APIError(status_code=404, code="ROADMAP_NOT_FOUND", message="No active roadmap was found")
        return self._response(roadmap)

    def get(self, identity: AuthenticatedUser, roadmap_id: str) -> RoadmapResponse:
        roadmap = self.db.query(Roadmap).filter(Roadmap.id == roadmap_id, Roadmap.user_id == identity.user_id).first()
        if roadmap is None:
            raise APIError(status_code=404, code="ROADMAP_NOT_FOUND", message="Roadmap was not found")
        return self._response(roadmap)

    def update_milestone(self, identity: AuthenticatedUser, roadmap_id: str, milestone_id: str, update: MilestoneProgressUpdate) -> MilestoneResponse:
        _roadmap, _version, milestone = self._owned_milestone(identity, roadmap_id, milestone_id)
        milestone.progress_percentage = update.progress_percentage
        milestone.status = "completed" if update.progress_percentage == 100 else "in_progress" if update.progress_percentage > 0 else "not_started"
        if update.progress_percentage == 100:
            milestone.completed_at = milestone.completed_at or datetime.utcnow()
        if update.resource_url and update.resource_title:
            activity = self.db.query(LearningActivity).filter(LearningActivity.user_id == identity.user_id, LearningActivity.milestone_id == milestone.id, LearningActivity.resource_url == update.resource_url).first()
            if activity is None:
                activity = LearningActivity(id=str(uuid.uuid4()), user_id=identity.user_id, milestone_id=milestone.id, resource_url=update.resource_url, resource_title=update.resource_title)
                self.db.add(activity)
            activity.progress_percentage = update.progress_percentage
            activity.status = milestone.status
            activity.time_spent_minutes = (activity.time_spent_minutes or 0) + update.time_spent_minutes
            activity.usefulness_rating = update.usefulness_rating
            activity.difficulty_rating = update.difficulty_rating
            activity.started_at = activity.started_at or datetime.utcnow()
            activity.completed_at = datetime.utcnow() if update.progress_percentage == 100 else None
        self.db.commit()
        self.db.refresh(milestone)
        return self._milestone_response(milestone)

    def complete_milestone(self, identity: AuthenticatedUser, roadmap_id: str, milestone_id: str, completion: MilestoneCompletion) -> MilestoneResponse:
        _roadmap, _version, milestone = self._owned_milestone(identity, roadmap_id, milestone_id)
        incomplete = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.version_id == milestone.version_id, RoadmapMilestone.stable_key.in_(milestone.prerequisite_keys), RoadmapMilestone.status != "completed").count()
        if incomplete:
            raise APIError(status_code=409, code="PREREQUISITES_INCOMPLETE", message="Complete prerequisite milestones first")
        milestone.status = "completed"
        milestone.progress_percentage = 100
        milestone.reflection = completion.reflection
        milestone.completed_at = milestone.completed_at or datetime.utcnow()
        self.db.commit()
        self.db.refresh(milestone)
        return self._milestone_response(milestone)

    def _resources_for(self, skill_name: str, language: str | None) -> list[dict]:
        canonical = canonical_skill_name(skill_name)
        resources = self.db.query(LearningResource).filter(
            LearningResource.archived_at.is_(None), LearningResource.suppressed_at.is_(None),
            LearningResource.link_status.notin_(["broken", "unsafe"]),
            or_(
                LearningResource.verification_status == "verified",
                and_(
                    LearningResource.verification_status == "vetted",
                    LearningResource.resource_score >= settings.RESOURCE_VETTED_SCORE_THRESHOLD,
                    LearningResource.score_confidence >= settings.RESOURCE_MIN_CONFIDENCE,
                ),
            ),
        ).all()
        resource_ids = [resource.id for resource in resources]
        indexed: dict[str, float] = {}
        if resource_ids:
            for mapping, skill in self.db.query(ResourceSkillMap, Skill).join(
                Skill, ResourceSkillMap.skill_id == Skill.id
            ).filter(ResourceSkillMap.resource_id.in_(resource_ids)).all():
                if canonical_skill_name(skill.display_name) == canonical:
                    indexed[mapping.resource_id] = mapping.relevance_score
        ranked = []
        for resource in resources:
            terms = {canonical_skill_name(topic) for topic in (resource.topics or [])}
            title = resource.title.casefold()
            relevance = indexed.get(resource.id, 100 if canonical in terms or any(part in title for part in canonical.split()) else 0)
            if relevance < 60:
                continue
            algorithm_score = resource.score_override if resource.score_override is not None else resource.resource_score
            score = float(algorithm_score if algorithm_score is not None else 82)
            confidence = float(resource.score_confidence if resource.score_confidence is not None else .95)
            rank_score = score * (0.7 + 0.3 * confidence) + (8 if resource.verification_status == "verified" else 0)
            if language and resource.language.casefold() == language.casefold():
                rank_score += 3
            ranked.append((rank_score, resource, score, confidence))
        ranked.sort(key=lambda pair: (-pair[0], pair[1].title.casefold()))
        selected = []
        creator_counts: dict[str, int] = {}
        seen_types: set[str] = set()
        for prefer_new_type in (True, False):
            for item in ranked:
                if item in selected:
                    continue
                resource = item[1]
                creator = (resource.author or resource.provider).casefold()
                if creator_counts.get(creator, 0) >= 2:
                    continue
                if prefer_new_type and resource.resource_type in seen_types:
                    continue
                selected.append(item)
                creator_counts[creator] = creator_counts.get(creator, 0) + 1
                seen_types.add(resource.resource_type)
                if len(selected) == 3:
                    break
            if len(selected) == 3:
                break
        return [{
            "id": item.id, "title": item.title, "provider": item.provider, "type": item.resource_type,
            "url": item.url, "status": item.verification_status, "score": round(score, 2),
            "confidence": round(confidence, 3), "score_version": item.score_version,
            "explanation": (
                f"Human-reviewed {item.resource_type} covering {skill_name}." if item.verification_status == "verified"
                else f"Automatically vetted {item.resource_type} covering {skill_name}."
            ),
            "provenance": "verified_catalog" if item.verification_status == "verified" else "vetted_index",
        } for _rank, item, score, confidence in selected]

    def _goal_path(self, profile) -> list[dict]:
        rows = self.db.query(LearnerGoalSkill, Skill).join(Skill, LearnerGoalSkill.skill_id == Skill.id).filter(
            LearnerGoalSkill.user_id == profile.user_id,
            LearnerGoalSkill.profile_version == profile.profile_version,
        ).order_by(LearnerGoalSkill.sequence).all()
        if not rows:
            return target_path(profile.target_role or "learning goal")
        key_by_skill_id = {
            requirement.skill_id: re.sub(r"[^a-z0-9]+", "-", skill.canonical_name).strip("-")
            for requirement, skill in rows
        }
        return [{
            "key": key_by_skill_id[requirement.skill_id],
            "title": f"Build proficiency in {skill.display_name}",
            "skill": skill.display_name,
            "hours": 14 if requirement.resource_intent == "project" else 10 if requirement.importance >= .9 else 8,
            "requires": [key_by_skill_id[skill_id] for skill_id in (requirement.prerequisite_skill_ids or []) if skill_id in key_by_skill_id],
        } for requirement, skill in rows]

    def _owned_milestone(self, identity: AuthenticatedUser, roadmap_id: str, milestone_id: str):
        roadmap = self.db.query(Roadmap).filter(Roadmap.id == roadmap_id, Roadmap.user_id == identity.user_id).first()
        if roadmap is None:
            raise APIError(status_code=404, code="ROADMAP_NOT_FOUND", message="Roadmap was not found")
        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.roadmap_id == roadmap.id, RoadmapVersion.status == "active").first()
        milestone = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.id == milestone_id, RoadmapMilestone.version_id == version.id).first() if version else None
        if milestone is None:
            raise APIError(status_code=404, code="MILESTONE_NOT_FOUND", message="Milestone was not found")
        return roadmap, version, milestone

    def _response(self, roadmap: Roadmap) -> RoadmapResponse:
        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.roadmap_id == roadmap.id, RoadmapVersion.status == "active").first()
        if version is None:
            raise APIError(status_code=500, code="ROADMAP_VERSION_MISSING", message="Active roadmap version is unavailable")
        milestones = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.version_id == version.id).order_by(RoadmapMilestone.sequence).all()
        return RoadmapResponse(
            id=roadmap.id, target_role=roadmap.target_role, objective=(roadmap.full_plan or {}).get("objective"),
            version_id=version.id, version_number=version.version_number, status=version.status,
            estimated_completion_weeks=roadmap.estimated_completion_weeks, generated_at=roadmap.generated_at,
            skill_gaps=roadmap.skill_gaps or [], milestones=[self._milestone_response(item) for item in milestones],
        )

    @staticmethod
    def _milestone_response(item: RoadmapMilestone) -> MilestoneResponse:
        return MilestoneResponse(
            id=item.id, stable_key=item.stable_key, title=item.title, description=item.description,
            sequence=item.sequence, prerequisite_keys=item.prerequisite_keys or [], target_skills=item.target_skills or [],
            estimated_hours=item.estimated_hours, scheduled_start=item.scheduled_start, deadline=item.deadline,
            status=item.status, progress_percentage=item.progress_percentage,
            recommended_resources=item.recommended_resources or [], assessment_config=item.assessment_config or {},
            explanation=item.explanation or {}, reflection=item.reflection, completed_at=item.completed_at,
        )
