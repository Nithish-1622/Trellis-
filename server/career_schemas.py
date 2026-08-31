"""Typed contracts for career recommendations and evidence."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, BaseModel, Field, StringConstraints


class SalaryRange(BaseModel):
    min: float | None = None
    max: float | None = None
    currency: str = "USD"


class JobRecommendation(BaseModel):
    id: str
    title: str
    company: str
    location: str
    job_type: str
    required_skills: list[str] = Field(default_factory=list)
    salary_range: SalaryRange | None = None
    description: str = ""
    url: AnyHttpUrl
    posted_date: datetime | None = None
    source: str
    match_score: float = Field(ge=0, le=1)
    explanation: str


class JobRecommendationPage(BaseModel):
    items: list[JobRecommendation]
    total: int


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=200)
    status: Literal["saved", "applied", "interviewed", "offered", "rejected", "withdrawn"] = "applied"
    url: AnyHttpUrl | None = None
    feedback: str | None = Field(default=None, max_length=5000)
    interview_topics: list[str] = Field(default_factory=list, max_length=25)
    match_score: float | None = Field(default=None, ge=0, le=1)
    notes: str | None = Field(default=None, max_length=5000)


class ApplicationResponse(BaseModel):
    id: str
    company: str
    position: str
    status: str
    url: str | None
    feedback: str | None
    interview_topics: list[str]
    match_score: float | None
    created_at: datetime


class InterviewStart(BaseModel):
    target_role: str | None = Field(default=None, max_length=200)
    focus_area: str = Field(default="role fundamentals", min_length=1, max_length=200)
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"


class InterviewAnswer(BaseModel):
    answer: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10_000)]


class InterviewInteraction(BaseModel):
    session_id: str
    status: str
    question: str | None
    question_number: int
    question_count: int
    previous_score: float | None = None
    previous_feedback: str | None = None


class InterviewReport(BaseModel):
    session_id: str
    target_role: str
    status: str
    overall_score: float | None
    topic_scores: dict[str, float]
    strengths: list[str]
    improvements: list[str]
    summary: str
    transcript: list[dict]
    created_at: datetime
    completed_at: datetime | None
