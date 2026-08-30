"""Catalog administration and index-first learner resource ranking."""

from datetime import datetime
import re
import uuid

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from catalog_schemas import (
    ImportResult,
    RecommendationPage,
    ResourceBulkCreate,
    ResourceCreate,
    ResourcePage,
    ResourceRecommendation,
    ResourceResponse,
    ResourceUpdate,
)
from config import settings
from database import LearningHistory, LearningResource, ResourceSkillMap, Skill
from errors import APIError
from profile_service import LearnerProfileService
from resource_providers import canonical_resource_key


def _terms(values: list[str]) -> set[str]:
    return {
        token for value in values for token in re.findall(r"[a-z0-9+#.]+", value.casefold()) if len(token) > 1
    }


class CatalogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, admin: AuthenticatedUser, payload: ResourceCreate) -> ResourceResponse:
        resource = LearningResource(id=str(uuid.uuid4()))
        self._apply(resource, payload.model_dump(mode="json"), admin.user_id)
        self.db.add(resource)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise APIError(status_code=409, code="RESOURCE_DUPLICATE", message="This provider resource already exists") from exc
        self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    def bulk_create(self, admin: AuthenticatedUser, payload: ResourceBulkCreate) -> ImportResult:
        created: list[ResourceResponse] = []
        skipped = 0
        for item in payload.resources:
            canonical_key = canonical_resource_key(item.provider, item.external_id, str(item.url))
            if self.db.query(LearningResource).filter_by(canonical_key=canonical_key).first():
                skipped += 1
                continue
            resource = LearningResource(id=str(uuid.uuid4()))
            self._apply(resource, item.model_dump(mode="json"), admin.user_id)
            self.db.add(resource)
            self.db.flush()
            created.append(ResourceResponse.model_validate(resource))
        self.db.commit()
        return ImportResult(created=len(created), skipped=skipped, items=created)

    def set_link_status(self, resource_id: str, link_status: str) -> ResourceResponse:
        resource = self._get(resource_id)
        resource.link_status = link_status
        self.db.commit()
        self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    def update(self, admin: AuthenticatedUser, resource_id: str, payload: ResourceUpdate) -> ResourceResponse:
        resource = self._get(resource_id)
        self._apply(resource, payload.model_dump(mode="json", exclude_unset=True), admin.user_id)
        self.db.commit()
        self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    def archive(self, resource_id: str) -> ResourceResponse:
        resource = self._get(resource_id)
        resource.archived_at = resource.archived_at or datetime.utcnow()
        self.db.commit()
        self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    def list_admin(self, limit: int, offset: int) -> ResourcePage:
        query = self.db.query(LearningResource)
        total = query.count()
        items = query.order_by(LearningResource.updated_at.desc()).offset(offset).limit(limit).all()
        return ResourcePage(items=[ResourceResponse.model_validate(item) for item in items], total=total, limit=limit, offset=offset)

    def recommendations(self, identity: AuthenticatedUser, limit: int, offset: int, resource_type: str | None) -> RecommendationPage:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        query = self.db.query(LearningResource).filter(
            LearningResource.archived_at.is_(None),
            LearningResource.suppressed_at.is_(None),
            LearningResource.link_status.notin_(["broken", "unsafe"]),
            or_(
                LearningResource.verification_status == "verified",
                and_(
                    LearningResource.verification_status == "vetted",
                    LearningResource.resource_score >= settings.RESOURCE_VETTED_SCORE_THRESHOLD,
                    LearningResource.score_confidence >= settings.RESOURCE_MIN_CONFIDENCE,
                ),
            ),
        )
        if resource_type:
            query = query.filter(LearningResource.resource_type == resource_type)
        resources = query.all()
        completed = {
            (item.title.casefold().strip(), (item.provider or "").casefold().strip())
            for item in self.db.query(LearningHistory).filter(LearningHistory.user_id == identity.user_id)
        }
        profile_terms = _terms(
            [profile.target_role or "", profile.objective or "", *(profile.interests or [])]
            + [item.display_name for item in profile.learner_skills]
        )
        known_terms = _terms([item.display_name for item in profile.learner_skills])
        resource_ids = [resource.id for resource in resources]
        mappings: dict[str, list[tuple[str, float]]] = {}
        if resource_ids:
            rows = self.db.query(ResourceSkillMap, Skill).join(Skill, ResourceSkillMap.skill_id == Skill.id).filter(
                ResourceSkillMap.resource_id.in_(resource_ids)
            ).all()
            for mapping, skill in rows:
                mappings.setdefault(mapping.resource_id, []).append((skill.display_name, mapping.relevance_score))

        ranked: list[tuple[float, LearningResource, set[str], list[str], float, float]] = []
        for resource in resources:
            if (resource.title.casefold().strip(), resource.provider.casefold().strip()) in completed:
                continue
            indexed_skills = mappings.get(resource.id, [])
            skill_names = [name for name, relevance in indexed_skills if relevance >= 60]
            matched = profile_terms & _terms([resource.title, *(resource.topics or []), *skill_names])
            algorithm_score = resource.score_override if resource.score_override is not None else resource.resource_score
            score = float(algorithm_score if algorithm_score is not None else 82 if resource.verification_status == "verified" else 0)
            confidence = float(resource.score_confidence if resource.score_confidence is not None else .95 if resource.verification_status == "verified" else 0)
            rank_score = score * (0.7 + 0.3 * confidence)
            if resource.verification_status == "verified":
                rank_score += 8
            if resource.resource_type in (profile.preferred_formats or []):
                rank_score += 4
            if not profile.preferred_language or resource.language.casefold() == profile.preferred_language.casefold():
                rank_score += 3
            else:
                rank_score -= 15
            if resource.is_pinned:
                rank_score += 4
            ranked.append((rank_score, resource, matched, skill_names, score, confidence))
        ranked.sort(key=lambda item: (-item[0], item[1].title.casefold()))

        diversified = []
        creator_counts: dict[str, int] = {}
        for item in ranked:
            creator = (item[1].author or item[1].provider).casefold()
            if creator_counts.get(creator, 0) >= 2:
                continue
            creator_counts[creator] = creator_counts.get(creator, 0) + 1
            diversified.append(item)

        recommendations = []
        for _rank, resource, matched, skill_names, score, confidence in diversified[offset:offset + limit]:
            reasons = []
            if matched:
                reasons.append(f"Matches your focus on {', '.join(sorted(matched)[:3])}.")
            if skill_names:
                reasons.append(f"Indexed for {', '.join(skill_names[:3])}.")
            reasons.append("Human-reviewed catalog resource." if resource.verification_status == "verified" else "Passed Trellis automated quality vetting.")
            prerequisites = _terms(resource.prerequisites or [])
            base = ResourceResponse.model_validate(resource).model_dump()
            recommendations.append(ResourceRecommendation(
                **base, score=round(score, 2), confidence=round(confidence, 3),
                skills=skill_names or list(resource.topics or []), source=resource.provider,
                status=resource.verification_status, why_recommended=reasons,
                explanation=" ".join(reasons),
                provenance="verified_catalog" if resource.verification_status == "verified" else "vetted_index",
                prerequisite_status="ready" if not prerequisites or prerequisites <= known_terms else "review_required",
            ))
        self.db.commit()
        return RecommendationPage(items=recommendations, total=len(diversified), limit=limit, offset=offset)

    def _get(self, resource_id: str) -> LearningResource:
        resource = self.db.get(LearningResource, resource_id)
        if resource is None:
            raise APIError(status_code=404, code="RESOURCE_NOT_FOUND", message="Learning resource was not found")
        return resource

    @staticmethod
    def _apply(resource: LearningResource, data: dict, admin_id: str) -> None:
        for key, value in data.items():
            if key == "metadata":
                resource.resource_metadata = value
            else:
                setattr(resource, key, value)
        resource.canonical_key = canonical_resource_key(resource.provider, resource.external_id, str(resource.url))
        if data.get("verification_status") == "verified":
            resource.verified_by = admin_id
            resource.verified_at = datetime.utcnow()
        elif "verification_status" in data and data["verification_status"] != "verified":
            resource.verified_by = None
            resource.verified_at = None
