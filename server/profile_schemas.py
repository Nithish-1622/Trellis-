"""Typed API contracts for learner profiles and resumable onboarding."""

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class OnboardingStep(str, Enum):
    GOAL = "goal"
    CURRENT_POSITION = "current_position"
    PREVIOUS_LEARNING = "previous_learning"
    PREFERENCES = "preferences"
    REVIEW = "review"


class GoalDraft(BaseModel):
    free_text: str = Field(min_length=10, max_length=2000)
    target_role: str | None = Field(default=None, max_length=200)
    objective: str | None = Field(default=None, max_length=1000)
    target_date: date | None = None


class GoalAnalysisRequest(BaseModel):
    goal: str = Field(min_length=10, max_length=2000)


class GoalAnalysisResponse(BaseModel):
    target_role: str = Field(min_length=1, max_length=200)
    objective: str = Field(min_length=1, max_length=1000)
    target_date: date | None = None
    explanation: str = Field(min_length=1, max_length=1000)


class SkillDraft(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    proficiency: str = Field(pattern="^(beginner|intermediate|advanced|expert)$")
    evidence_source: str = Field(default="self_reported", max_length=100)
    evidence_url: str | None = Field(default=None, max_length=2000)
    evidence_rationale: str | None = Field(default=None, max_length=500)


class CurrentPositionDraft(BaseModel):
    current_role: str | None = Field(default=None, max_length=200)
    experience_years: float | None = Field(default=None, ge=0, le=80)
    education_level: str | None = Field(default=None, max_length=200)
    interests: list[str] = Field(default_factory=list, max_length=30)
    skills: list[SkillDraft] = Field(default_factory=list, max_length=50)
    resume_filename: str | None = Field(default=None, max_length=255)
    resume_file_id: str | None = Field(default=None, max_length=255)
    resume_certifications: list[str] = Field(default_factory=list, max_length=20)
    resume_projects: list[str] = Field(default_factory=list, max_length=20)


class CompletedCourseDraft(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    provider: str | None = Field(default=None, max_length=200)
    completion_date: date | None = None
    topics: list[str] = Field(default_factory=list, max_length=30)
    rating: int | None = Field(default=None, ge=1, le=5)
    evidence_url: str | None = Field(default=None, max_length=2000)


class PreviousLearningDraft(BaseModel):
    courses: list[CompletedCourseDraft] = Field(default_factory=list, max_length=100)


class LearningPreferencesDraft(BaseModel):
    preferred_formats: list[str] = Field(default_factory=list, max_length=10)
    project_theory_balance: int | None = Field(default=None, ge=0, le=100)
    learning_pace: str | None = Field(default=None, max_length=100)
    weekly_hours: float | None = Field(default=None, ge=1, le=80)
    preferred_language: str | None = Field(default="English", max_length=100)
    budget: str | None = Field(default=None, max_length=100)
    accessibility_needs: list[str] = Field(default_factory=list, max_length=20)
    preferred_session_minutes: int | None = Field(default=None, ge=10, le=240)


class OnboardingDraft(BaseModel):
    goal: GoalDraft | None = None
    current_position: CurrentPositionDraft | None = None
    previous_learning: PreviousLearningDraft | None = None
    preferences: LearningPreferencesDraft | None = None


class OnboardingUpdate(BaseModel):
    current_step: OnboardingStep
    completed_steps: list[OnboardingStep] = Field(default_factory=list)
    draft: OnboardingDraft
    complete: bool = False


class OnboardingSessionResponse(BaseModel):
    session_id: str | None
    status: str
    current_step: OnboardingStep
    completed_steps: list[OnboardingStep]
    draft: OnboardingDraft
    updated_at: datetime | None
    completed_at: datetime | None


class LearnerSkillResponse(BaseModel):
    id: str
    name: str
    canonical_name: str
    proficiency: str
    confidence: float
    source: str
    evidence_url: str | None


class LearnerProfileResponse(BaseModel):
    user_id: str
    current_role: str | None
    target_role: str | None
    objective: str | None
    target_date: datetime | None
    experience_years: float
    education_level: str | None
    interests: list[str]
    preferred_formats: list[str]
    project_theory_balance: int | None
    learning_pace: str | None
    weekly_hours: float | None
    preferred_language: str | None
    budget: str | None
    accessibility_needs: list[str]
    preferred_session_minutes: int | None
    skills: list[LearnerSkillResponse]
    is_onboarding_complete: bool
    updated_at: datetime | None
