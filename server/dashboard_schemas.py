"""Read models for learner skills and the progress dashboard."""

from datetime import datetime

from pydantic import BaseModel


class SkillSummary(BaseModel):
    id: str
    name: str
    canonical_name: str
    proficiency: str
    estimated_score: float
    confidence: float
    evidence_count: int
    trend: float
    source: str


class SkillPage(BaseModel):
    items: list[SkillSummary]
    total: int


class RoadmapDashboardSummary(BaseModel):
    id: str
    target_role: str
    version_number: int
    progress_percentage: int
    completed_milestones: int
    total_milestones: int


class AssessmentSummary(BaseModel):
    id: str
    milestone_id: str
    assessment_type: str
    score: float
    provisional: bool
    created_at: datetime


class DeadlineSummary(BaseModel):
    milestone_id: str
    title: str
    deadline: datetime
    status: str


class NextAction(BaseModel):
    action_type: str
    title: str
    explanation: str
    href: str
    milestone_id: str | None = None


class DashboardResponse(BaseModel):
    roadmap: RoadmapDashboardSummary | None
    weekly_effort_minutes: int
    skill_growth: list[SkillSummary]
    recent_assessments: list[AssessmentSummary]
    deadlines: list[DeadlineSummary]
    blockers: list[str]
    streak_days: int
    next_action: NextAction
