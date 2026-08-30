"""Contracts for objective quizzes and provisional project reviews."""

from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, Field


class QuizQuestionResponse(BaseModel):
    id: str
    prompt: str
    options: list[str]


class QuizResponse(BaseModel):
    milestone_id: str
    questions: list[QuizQuestionResponse]


class QuizAnswer(BaseModel):
    question_id: str = Field(min_length=1, max_length=100)
    answer: str = Field(min_length=1, max_length=1000)


class QuizAttemptRequest(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1, max_length=20)
    reflection: str | None = Field(default=None, max_length=5000)


class ProjectSubmissionRequest(BaseModel):
    repository_url: AnyHttpUrl
    summary: str = Field(min_length=20, max_length=5000)
    reflection: str | None = Field(default=None, max_length=5000)


class RubricCriterion(BaseModel):
    criterion: str
    score: float = Field(ge=0, le=1)
    rationale: str


class ProjectGrade(BaseModel):
    score: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    rationale: str
    rubric: list[RubricCriterion]


class AssessmentAttemptResponse(BaseModel):
    id: str
    milestone_id: str
    assessment_type: str
    score: float
    confidence: float
    rationale: str | None
    rubric: list[dict]
    provisional: bool
    reflection: str | None
    created_at: datetime

