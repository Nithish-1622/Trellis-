"""Create and atomically decide immutable roadmap adaptation proposals."""

from copy import deepcopy
from datetime import datetime, timedelta
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from adaptation_schemas import AdaptationRequest, AdaptationResponse
from auth import AuthenticatedUser
from database import AdaptationProposal, AssessmentAttempt, Roadmap, RoadmapMilestone, RoadmapVersion
from errors import APIError


class AdaptationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, identity: AuthenticatedUser, roadmap_id: str, request: AdaptationRequest) -> AdaptationResponse:
        roadmap = self._roadmap(identity, roadmap_id)
        base = self.db.query(RoadmapVersion).filter(RoadmapVersion.roadmap_id == roadmap.id, RoadmapVersion.status == "active").first()
        if base is None:
            raise APIError(status_code=409, code="ACTIVE_VERSION_REQUIRED", message="An active roadmap version is required")
        if self.db.query(AdaptationProposal).filter(AdaptationProposal.user_id == identity.user_id, AdaptationProposal.roadmap_id == roadmap.id, AdaptationProposal.status == "pending").first():
            raise APIError(status_code=409, code="ADAPTATION_PENDING", message="Decide the pending adaptation before creating another")

        attempt = self._latest_attempt(identity.user_id, base.id, request.evidence_ids)
        if attempt is None:
            raise APIError(status_code=409, code="ADAPTATION_EVIDENCE_REQUIRED", message="New assessment evidence is required")
        assessed = self.db.get(RoadmapMilestone, attempt.milestone_id)
        if assessed is None or assessed.status == "completed":
            raise APIError(status_code=409, code="NO_UNFINISHED_CHANGE", message="Completed roadmap content cannot be adapted")
        mode = "remediation" if attempt.score < 0.5 else "acceleration" if attempt.score >= 0.8 else None
        if mode is None:
            raise APIError(status_code=409, code="NO_MEANINGFUL_ADAPTATION", message="Current evidence does not justify a roadmap change")

        version_number = (self.db.query(func.max(RoadmapVersion.version_number)).filter(RoadmapVersion.roadmap_id == roadmap.id).scalar() or 0) + 1
        proposed = RoadmapVersion(
            id=str(uuid.uuid4()), roadmap_id=roadmap.id, version_number=version_number, status="proposed",
            rationale=f"{mode.title()} proposed from {attempt.assessment_type} evidence scored at {attempt.score:.0%}.",
            change_summary={}, created_at=datetime.utcnow(), activated_at=None,
        )
        self.db.add(proposed)
        self.db.flush()
        diff = self._build_version(base, proposed, assessed, mode)
        proposed.change_summary = diff
        proposal = AdaptationProposal(
            id=str(uuid.uuid4()), user_id=identity.user_id, roadmap_id=roadmap.id,
            base_version_id=base.id, proposed_version_id=proposed.id, status="pending", diff=diff,
            evidence_ids=[attempt.id], created_at=datetime.utcnow(),
        )
        self.db.add(proposal)
        self.db.commit()
        self.db.refresh(proposal)
        return self._response(proposal)

    def pending(self, identity: AuthenticatedUser) -> AdaptationResponse:
        proposal = self.db.query(AdaptationProposal).filter(AdaptationProposal.user_id == identity.user_id, AdaptationProposal.status == "pending").order_by(AdaptationProposal.created_at.desc()).first()
        if proposal is None:
            raise APIError(status_code=404, code="ADAPTATION_NOT_FOUND", message="No pending adaptation was found")
        return self._response(proposal)

    def accept(self, identity: AuthenticatedUser, proposal_id: str) -> AdaptationResponse:
        proposal = self._proposal(identity, proposal_id)
        if proposal.status != "pending":
            return self._response(proposal)
        base = self.db.get(RoadmapVersion, proposal.base_version_id)
        proposed = self.db.get(RoadmapVersion, proposal.proposed_version_id)
        if base is None or proposed is None or base.status != "active":
            raise APIError(status_code=409, code="ADAPTATION_STALE", message="The active roadmap changed before this proposal was decided")
        now = datetime.utcnow()
        base.status = "superseded"
        proposed.status = "active"
        proposed.activated_at = now
        proposal.status = "accepted"
        proposal.decided_at = now
        roadmap = self.db.get(Roadmap, proposal.roadmap_id)
        if roadmap:
            roadmap.last_updated = now
        self.db.commit()
        self.db.refresh(proposal)
        return self._response(proposal)

    def reject(self, identity: AuthenticatedUser, proposal_id: str, feedback: str | None) -> AdaptationResponse:
        proposal = self._proposal(identity, proposal_id)
        if proposal.status != "pending":
            return self._response(proposal)
        proposed = self.db.get(RoadmapVersion, proposal.proposed_version_id)
        if proposed:
            proposed.status = "rejected"
        proposal.status = "rejected"
        proposal.feedback = feedback
        proposal.decided_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(proposal)
        return self._response(proposal)

    def _build_version(self, base: RoadmapVersion, proposed: RoadmapVersion, assessed: RoadmapMilestone, mode: str) -> dict:
        original = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.version_id == base.id).order_by(RoadmapMilestone.sequence).all()
        additions: list[dict] = []
        removals: list[dict] = []
        resequenced: list[dict] = []
        sequence = 1
        remediation_key = f"remediation-{assessed.stable_key}"
        for item in original:
            if mode == "acceleration" and item.id == assessed.id and item.status != "completed":
                removals.append({"stable_key": item.stable_key, "title": item.title, "reason": "strong_evidence"})
                continue
            if mode == "remediation" and item.id == assessed.id:
                remediation = self._clone(item, proposed.id, sequence)
                remediation.id = str(uuid.uuid4())
                remediation.stable_key = remediation_key
                remediation.title = f"Reinforce: {item.title}"
                remediation.description = f"Targeted practice before retrying {item.title}."
                remediation.estimated_hours = max(3, item.estimated_hours * 0.5)
                remediation.recommended_resources = deepcopy((item.recommended_resources or [])[:1])
                remediation.assessment_config = {"quiz": {"question_count": 3, "remediation": True}}
                remediation.explanation = {"why": "Recent evidence showed a gap that warrants focused practice before continuing.", "confidence": 0.9, "provenance": ["assessment_evidence"], "alternatives": []}
                remediation.status = "not_started"
                remediation.progress_percentage = 0
                remediation.completed_at = None
                remediation.reflection = None
                self.db.add(remediation)
                additions.append({"stable_key": remediation_key, "title": remediation.title, "reason": "remediation"})
                sequence += 1

            clone = self._clone(item, proposed.id, sequence)
            if mode == "remediation" and item.id == assessed.id:
                clone.prerequisite_keys = list(dict.fromkeys([*(clone.prerequisite_keys or []), remediation_key]))
            if mode == "acceleration":
                clone.prerequisite_keys = [key for key in (clone.prerequisite_keys or []) if key != assessed.stable_key]
            if clone.sequence != item.sequence:
                resequenced.append({"stable_key": clone.stable_key, "from": item.sequence, "to": clone.sequence})
            self.db.add(clone)
            sequence += 1
        return {"additions": additions, "removals": removals, "resequenced": resequenced, "timeline_change": f"Version {proposed.version_number} {'adds focused practice' if mode == 'remediation' else 'removes demonstrated material'}.", "explanation": proposed.rationale}

    @staticmethod
    def _clone(item: RoadmapMilestone, version_id: str, sequence: int) -> RoadmapMilestone:
        duration = item.deadline - item.scheduled_start if item.deadline and item.scheduled_start else timedelta(days=7)
        start = item.scheduled_start
        return RoadmapMilestone(
            id=str(uuid.uuid4()), version_id=version_id, stable_key=item.stable_key, title=item.title,
            description=item.description, sequence=sequence, prerequisite_keys=deepcopy(item.prerequisite_keys or []),
            target_skills=deepcopy(item.target_skills or []), estimated_hours=item.estimated_hours,
            scheduled_start=start, deadline=start + duration if start else item.deadline, status=item.status,
            progress_percentage=item.progress_percentage, recommended_resources=deepcopy(item.recommended_resources or []),
            assessment_config=deepcopy(item.assessment_config or {}), explanation=deepcopy(item.explanation or {}),
            reflection=item.reflection, completed_at=item.completed_at,
        )

    def _latest_attempt(self, user_id: str, version_id: str, evidence_ids: list[str]) -> AssessmentAttempt | None:
        query = self.db.query(AssessmentAttempt).join(RoadmapMilestone, AssessmentAttempt.milestone_id == RoadmapMilestone.id).filter(AssessmentAttempt.user_id == user_id, RoadmapMilestone.version_id == version_id)
        if evidence_ids:
            query = query.filter(AssessmentAttempt.id.in_(evidence_ids))
        return query.order_by(AssessmentAttempt.created_at.desc()).first()

    def _roadmap(self, identity: AuthenticatedUser, roadmap_id: str) -> Roadmap:
        roadmap = self.db.query(Roadmap).filter(Roadmap.id == roadmap_id, Roadmap.user_id == identity.user_id).first()
        if roadmap is None:
            raise APIError(status_code=404, code="ROADMAP_NOT_FOUND", message="Roadmap was not found")
        return roadmap

    def _proposal(self, identity: AuthenticatedUser, proposal_id: str) -> AdaptationProposal:
        proposal = self.db.query(AdaptationProposal).filter(AdaptationProposal.id == proposal_id, AdaptationProposal.user_id == identity.user_id).first()
        if proposal is None:
            raise APIError(status_code=404, code="ADAPTATION_NOT_FOUND", message="Adaptation proposal was not found")
        return proposal

    @staticmethod
    def _response(proposal: AdaptationProposal) -> AdaptationResponse:
        return AdaptationResponse(id=proposal.id, roadmap_id=proposal.roadmap_id, base_version_id=proposal.base_version_id, proposed_version_id=proposal.proposed_version_id, status=proposal.status, diff=proposal.diff or {}, evidence_ids=proposal.evidence_ids or [], feedback=proposal.feedback, created_at=proposal.created_at, decided_at=proposal.decided_at)
