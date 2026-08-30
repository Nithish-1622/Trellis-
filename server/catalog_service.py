"""Verified catalog administration and deterministic learner ranking."""

from datetime import datetime
import re
import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from catalog_schemas import (
    RecommendationPage,
    ResourceCreate,
    ResourcePage,
    ResourceRecommendation,
    ResourceResponse,
    ResourceUpdate,
)
from database import LearningHistory, LearningResource
from errors import APIError
from profile_service import LearnerProfileService


def _terms(values: list[str]) -> set[str]:
    return {
        token
        for value in values
        for token in re.findall(r"[a-z0-9+#.]+", value.casefold())
        if len(token) > 1
    }


class CatalogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, admin: AuthenticatedUser, payload: ResourceCreate) -> ResourceResponse:
        data = payload.model_dump(mode="json")
        resource = LearningResource(id=str(uuid.uuid4()))
        self._apply(resource, data, admin.user_id)
        self.db.add(resource)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise APIError(409, "RESOURCE_DUPLICATE", "This provider resource already exists") from exc
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

    def recommendations(
        self,
        identity: AuthenticatedUser,
        limit: int,
        offset: int,
        resource_type: str | None,
    ) -> RecommendationPage:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        query = self.db.query(LearningResource).filter(
            LearningResource.verification_status == "verified",
            LearningResource.archived_at.is_(None),
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
        ranked: list[tuple[float, LearningResource, set[str]]] = []
        for resource in resources:
            if (resource.title.casefold().strip(), resource.provider.casefold().strip()) in completed:
                continue
            matched = profile_terms & _terms([resource.title, *(resource.topics or [])])
            score = 0.35 + min(len(matched) * 0.12, 0.36)
            if resource.resource_type in (profile.preferred_formats or []):
                score += 0.12
            if not profile.preferred_language or resource.language.casefold() == profile.preferred_language.casefold():
                score += 0.08
            ranked.append((min(score, 0.99), resource, matched))
        ranked.sort(key=lambda item: (-item[0], item[1].title.casefold()))
        page = ranked[offset : offset + limit]
        recommendations = []
        for score, resource, matched in page:
            reason = f"Matches your focus on {', '.join(sorted(matched)[:3])}." if matched else "Adds a verified resource relevant to your learning objective."
            base = ResourceResponse.model_validate(resource).model_dump()
            recommendations.append(ResourceRecommendation(
                **base,
                score=round(score, 3),
                explanation=reason,
                provenance="verified_catalog",
                prerequisite_status="review_required" if resource.prerequisites else "ready",
            ))
        self.db.commit()
        return RecommendationPage(items=recommendations, total=len(ranked), limit=limit, offset=offset)

    def _get(self, resource_id: str) -> LearningResource:
        resource = self.db.get(LearningResource, resource_id)
        if resource is None:
            raise APIError(404, "RESOURCE_NOT_FOUND", "Learning resource was not found")
        return resource

    @staticmethod
    def _apply(resource: LearningResource, data: dict, admin_id: str) -> None:
        for key, value in data.items():
            if key == "metadata":
                resource.resource_metadata = value
            else:
                setattr(resource, key, value)
        if data.get("verification_status") == "verified":
            resource.verified_by = admin_id
            resource.verified_at = datetime.utcnow()
        elif "verification_status" in data and data["verification_status"] != "verified":
            resource.verified_by = None
            resource.verified_at = None

