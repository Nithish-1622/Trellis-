"""Privacy-bounded learner feedback and audited administrator exceptions."""

from datetime import datetime
import uuid

from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from catalog_schemas import (
    ResourceEvaluationPage,
    ResourceEvaluationResponse,
    ResourceInteractionCreate,
    ResourceInteractionResponse,
    ResourceModerationRequest,
    ResourceResponse,
)
from config import settings
from database import (
    LearningResource,
    ResourceEvaluation,
    ResourceInteraction,
    ResourceModerationAction,
    ResourceSignalSummary,
    Roadmap,
    RoadmapMilestone,
    RoadmapVersion,
)
from errors import APIError
from profile_service import LearnerProfileService
from resource_jobs import ResourceJobService


_SUMMARY_FIELD = {
    "impression": "impressions",
    "open": "opens",
    "helpful": "helpful",
    "not_helpful": "not_helpful",
    "report": "reports",
}


class ResourceFeedbackService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record(self, identity: AuthenticatedUser, resource_id: str, payload: ResourceInteractionCreate) -> ResourceInteractionResponse:
        LearnerProfileService(self.db).ensure_profile(identity)
        resource = self.db.query(LearningResource).filter(
            LearningResource.id == resource_id,
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
        ).first()
        if resource is None:
            raise APIError(status_code=404, code="RESOURCE_NOT_FOUND", message="Learning resource was not found")
        if payload.milestone_id:
            owned = self.db.query(RoadmapMilestone).join(
                RoadmapVersion, RoadmapMilestone.version_id == RoadmapVersion.id
            ).join(Roadmap, RoadmapVersion.roadmap_id == Roadmap.id).filter(
                RoadmapMilestone.id == payload.milestone_id, Roadmap.user_id == identity.user_id,
            ).first()
            if owned is None:
                raise APIError(status_code=404, code="MILESTONE_NOT_FOUND", message="Milestone was not found")
        existing = self.db.query(ResourceInteraction).filter_by(
            user_id=identity.user_id, idempotency_key=payload.idempotency_key,
        ).first()
        if existing:
            if existing.resource_id != resource_id or existing.event_type != payload.event_type:
                raise APIError(status_code=409, code="IDEMPOTENCY_KEY_REUSED", message="The idempotency key was already used for a different interaction")
            return self._response(existing, False)
        event = ResourceInteraction(
            id=str(uuid.uuid4()), resource_id=resource_id, user_id=identity.user_id,
            milestone_id=payload.milestone_id, session_id=payload.session_id,
            idempotency_key=payload.idempotency_key, event_type=payload.event_type,
            event_metadata={"report_reason": payload.report_reason} if payload.report_reason else {},
            created_at=datetime.utcnow(),
        )
        self.db.add(event)
        summary = self.db.query(ResourceSignalSummary).filter_by(resource_id=resource_id).with_for_update().first()
        if summary is None:
            summary = ResourceSignalSummary(resource_id=resource_id)
            self.db.add(summary)
            self.db.flush()
        field = _SUMMARY_FIELD[payload.event_type]
        setattr(summary, field, (getattr(summary, field) or 0) + 1)
        summary.updated_at = datetime.utcnow()
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            existing = self.db.query(ResourceInteraction).filter_by(
                user_id=identity.user_id, idempotency_key=payload.idempotency_key,
            ).one()
            return self._response(existing, False)
        if payload.event_type == "report":
            ResourceJobService(self.db).enqueue_evaluation(resource_id, "learner_report")
        self.db.refresh(event)
        return self._response(event, True)

    @staticmethod
    def _response(event: ResourceInteraction, created: bool) -> ResourceInteractionResponse:
        return ResourceInteractionResponse(
            id=event.id, resource_id=event.resource_id, event_type=event.event_type,
            created=created, created_at=event.created_at,
        )


class ResourceModerationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def moderate(self, admin: AuthenticatedUser, resource_id: str, request: ResourceModerationRequest) -> ResourceResponse:
        resource = self._resource(resource_id)
        previous = self._state(resource)
        now = datetime.utcnow()
        if request.action == "verify":
            resource.verification_status = "verified"
            resource.verified_by = admin.user_id
            resource.verified_at = now
        elif request.action == "reject":
            resource.verification_status = "rejected"
            resource.verified_by = None
            resource.verified_at = None
        elif request.action == "pin":
            resource.is_pinned = True
        elif request.action == "unpin":
            resource.is_pinned = False
        elif request.action == "suppress":
            resource.suppressed_at = resource.suppressed_at or now
        elif request.action == "unsuppress":
            resource.suppressed_at = None
        elif request.action == "score_override":
            resource.score_override = request.score
            resource.override_reason = request.reason
        elif request.action == "clear_score_override":
            resource.score_override = None
            resource.override_reason = None
        self.db.add(ResourceModerationAction(
            id=str(uuid.uuid4()), resource_id=resource.id, admin_user_id=admin.user_id,
            action_type=request.action, reason=request.reason, previous_value=previous,
            new_value=self._state(resource), created_at=now,
        ))
        self.db.commit()
        self.db.refresh(resource)
        return ResourceResponse.model_validate(resource)

    def enqueue_reevaluation(self, admin: AuthenticatedUser, resource_id: str, reason: str):
        resource = self._resource(resource_id)
        job = ResourceJobService(self.db).enqueue_evaluation(resource.id, "admin_request")
        self.db.add(ResourceModerationAction(
            id=str(uuid.uuid4()), resource_id=resource.id, admin_user_id=admin.user_id,
            action_type="reevaluate", reason=reason, previous_value={}, new_value={"job_id": job.id},
        ))
        self.db.commit()
        return job

    def evaluations(self, resource_id: str, limit: int, offset: int) -> ResourceEvaluationPage:
        self._resource(resource_id)
        query = self.db.query(ResourceEvaluation).filter_by(resource_id=resource_id)
        total = query.count()
        rows = query.order_by(ResourceEvaluation.evaluated_at.desc()).offset(offset).limit(limit).all()
        return ResourceEvaluationPage(
            items=[ResourceEvaluationResponse.model_validate(row) for row in rows],
            total=total, limit=limit, offset=offset,
        )

    def _resource(self, resource_id: str) -> LearningResource:
        resource = self.db.get(LearningResource, resource_id)
        if resource is None:
            raise APIError(status_code=404, code="RESOURCE_NOT_FOUND", message="Learning resource was not found")
        return resource

    @staticmethod
    def _state(resource: LearningResource) -> dict:
        return {
            "verification_status": resource.verification_status, "is_pinned": bool(resource.is_pinned),
            "suppressed_at": resource.suppressed_at.isoformat() if resource.suppressed_at else None,
            "score_override": resource.score_override,
        }
