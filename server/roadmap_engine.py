"""Deterministic skill-gap, prerequisite, scheduling, and resource pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta
import math
import re
import uuid

from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from database import (
    LearningActivity,
    LearningHistory,
    LearningResource,
    Roadmap,
    RoadmapMilestone,
    RoadmapVersion,
)
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
        path = target_path(role)
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
            rationale="Initial roadmap generated from confirmed profile, history, and verified resources.",
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
                    "provenance": ["learner_profile", "learning_history", "verified_catalog"],
                    "alternatives": [],
                },
            )
            self.db.add(milestone)
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
        resources = self.db.query(LearningResource).filter(LearningResource.verification_status == "verified", LearningResource.archived_at.is_(None)).all()
        ranked = []
        for resource in resources:
            terms = {canonical_skill_name(topic) for topic in (resource.topics or [])}
            title = resource.title.casefold()
            score = 1 if canonical in terms or any(part in title for part in canonical.split()) else 0
            if language and resource.language.casefold() == language.casefold():
                score += 0.2
            if score:
                ranked.append((score, resource))
        ranked.sort(key=lambda pair: (-pair[0], pair[1].title.casefold()))
        return [{"id": item.id, "title": item.title, "provider": item.provider, "type": item.resource_type, "url": item.url, "explanation": f"Verified {item.resource_type} covering {skill_name}.", "provenance": "verified_catalog"} for _, item in ranked[:3]]

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
