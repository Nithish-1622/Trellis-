"""Aggregate learner progress into one bounded dashboard read model."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from dashboard_schemas import (
    AssessmentSummary,
    DashboardResponse,
    DeadlineSummary,
    NextAction,
    RoadmapDashboardSummary,
    SkillPage,
    SkillSummary,
)
from database import (
    AssessmentAttempt,
    LearningActivity,
    Roadmap,
    RoadmapMilestone,
    RoadmapVersion,
    SkillEvidence,
)
from profile_service import LearnerProfileService


PROFICIENCY_SCORES = {"beginner": 0.25, "intermediate": 0.5, "advanced": 0.75, "expert": 0.95}


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def skills(self, identity: AuthenticatedUser) -> SkillPage:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        items: list[SkillSummary] = []
        for learner_skill in profile.learner_skills:
            evidence = self.db.query(SkillEvidence).filter(SkillEvidence.user_id == identity.user_id, SkillEvidence.skill_id == learner_skill.skill_id).all()
            base = PROFICIENCY_SCORES.get(learner_skill.proficiency, 0.25)
            weighted_total = sum((item.score or 0) * item.confidence * item.weight for item in evidence if item.score is not None)
            weight = sum(item.confidence * item.weight for item in evidence if item.score is not None)
            evidence_score = weighted_total / weight if weight else base
            estimated = base * 0.35 + evidence_score * 0.65 if weight else base
            evidence_confidence = min(0.95, learner_skill.confidence + weight * 0.12)
            items.append(SkillSummary(
                id=learner_skill.id, name=learner_skill.display_name, canonical_name=learner_skill.skill.canonical_name,
                proficiency=learner_skill.proficiency, estimated_score=round(estimated, 3), confidence=round(evidence_confidence, 3),
                evidence_count=len(evidence), trend=round(estimated - base, 3), source=learner_skill.source,
            ))
        items.sort(key=lambda item: (-item.estimated_score, item.name.casefold()))
        self.db.commit()
        return SkillPage(items=items, total=len(items))

    def dashboard(self, identity: AuthenticatedUser) -> DashboardResponse:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        skill_page = self.skills(identity)
        roadmap = self.db.query(Roadmap).filter(Roadmap.user_id == identity.user_id, Roadmap.is_active.is_(True)).order_by(Roadmap.generated_at.desc()).first()
        if roadmap is None:
            action = NextAction(
                action_type="complete_onboarding" if profile.onboarding_completed_at is None else "create_roadmap",
                title="Complete your learning profile" if profile.onboarding_completed_at is None else "Build your first roadmap",
                explanation="Your confirmed goal and availability are needed before Trellis can sequence recommendations." if profile.onboarding_completed_at is None else "Your profile is ready; generate an explained learning path next.",
                href="/onboarding" if profile.onboarding_completed_at is None else "/roadmap",
            )
            self.db.commit()
            return DashboardResponse(roadmap=None, weekly_effort_minutes=0, skill_growth=skill_page.items, recent_assessments=[], deadlines=[], blockers=[], streak_days=0, next_action=action)

        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.roadmap_id == roadmap.id, RoadmapVersion.status == "active").first()
        milestones = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.version_id == version.id).order_by(RoadmapMilestone.sequence).all() if version else []
        completed_keys = {item.stable_key for item in milestones if item.status == "completed"}
        completed_count = len(completed_keys)
        progress = round(sum(item.progress_percentage for item in milestones) / len(milestones)) if milestones else 0
        cutoff = datetime.utcnow() - timedelta(days=7)
        activities = self.db.query(LearningActivity).filter(LearningActivity.user_id == identity.user_id, LearningActivity.updated_at >= cutoff).all()
        weekly_effort = sum(item.time_spent_minutes for item in activities)
        attempts = self.db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == identity.user_id).order_by(AssessmentAttempt.created_at.desc()).limit(5).all()
        deadlines = [DeadlineSummary(milestone_id=item.id, title=item.title, deadline=item.deadline, status=item.status) for item in milestones if item.deadline and item.status != "completed"][:5]
        blockers = [f"{item.title} is waiting for {', '.join(key for key in item.prerequisite_keys if key not in completed_keys)}." for item in milestones if any(key not in completed_keys for key in item.prerequisite_keys)]
        next_milestone = next((item for item in milestones if item.status != "completed" and all(key in completed_keys for key in item.prerequisite_keys)), None)
        next_action = NextAction(
            action_type="continue_milestone" if next_milestone else "review_progress",
            title=next_milestone.title if next_milestone else "Review your completed roadmap",
            explanation=(next_milestone.explanation or {}).get("why", "This is the first unfinished milestone whose prerequisites are complete.") if next_milestone else "All current milestones are complete.",
            href=f"/roadmap#{next_milestone.id}" if next_milestone else "/roadmap",
            milestone_id=next_milestone.id if next_milestone else None,
        )
        activity_days = {item.updated_at.date() for item in activities}
        streak = self._streak(activity_days)
        self.db.commit()
        return DashboardResponse(
            roadmap=RoadmapDashboardSummary(id=roadmap.id, target_role=roadmap.target_role, version_number=version.version_number if version else 0, progress_percentage=progress, completed_milestones=completed_count, total_milestones=len(milestones)),
            weekly_effort_minutes=weekly_effort, skill_growth=skill_page.items[:8],
            recent_assessments=[AssessmentSummary(id=item.id, milestone_id=item.milestone_id, assessment_type=item.assessment_type, score=item.score, provisional=item.provisional, created_at=item.created_at) for item in attempts],
            deadlines=deadlines, blockers=blockers[:5], streak_days=streak, next_action=next_action,
        )

    @staticmethod
    def _streak(days: set) -> int:
        if not days:
            return 0
        cursor = datetime.utcnow().date()
        if cursor not in days:
            cursor -= timedelta(days=1)
        streak = 0
        while cursor in days:
            streak += 1
            cursor -= timedelta(days=1)
        return streak
