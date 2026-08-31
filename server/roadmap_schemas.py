"""Contracts for versioned learning roadmaps and milestone progress."""

from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapCreate(BaseModel):
    target_role: str | None = Field(default=None, min_length=2, max_length=200)


class MilestoneResponse(BaseModel):
    id: str
    stable_key: str
    title: str
    description: str | None
    sequence: int
    prerequisite_keys: list[str]
    target_skills: list[str]
    estimated_hours: float
    scheduled_start: datetime | None
    deadline: datetime | None
    status: str
    progress_percentage: int
    recommended_resources: list[dict]
    assessment_config: dict
    explanation: dict
    reflection: str | None
    completed_at: datetime | None


class RoadmapResponse(BaseModel):
    id: str
    target_role: str
    objective: str | None
    version_id: str
    version_number: int
    status: str
    estimated_completion_weeks: int
    generated_at: datetime
    skill_gaps: list[str]
    milestones: list[MilestoneResponse]


class MilestoneProgressUpdate(BaseModel):
    progress_percentage: int = Field(ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0, le=100_000)
    resource_url: str | None = Field(default=None, max_length=2000)
    resource_title: str | None = Field(default=None, max_length=500)
    usefulness_rating: int | None = Field(default=None, ge=1, le=5)
    difficulty_rating: int | None = Field(default=None, ge=1, le=5)


class MilestoneCompletion(BaseModel):
    reflection: str | None = Field(default=None, max_length=5000)
