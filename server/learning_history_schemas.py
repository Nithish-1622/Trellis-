"""Contracts for learner-owned history imports and resume evidence."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class LearningHistoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    provider: str | None = Field(default=None, max_length=200)
    external_id: str | None = Field(default=None, max_length=300)
    resource_url: str | None = Field(default=None, max_length=2000)
    completion_date: date | None = None
    topics: list[str] = Field(default_factory=list, max_length=30)
    rating: int | None = Field(default=None, ge=1, le=5)
    evidence_url: str | None = Field(default=None, max_length=2000)


class LearningHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    provider: str | None
    external_id: str | None
    resource_url: str | None
    completion_date: datetime | None
    topics: list[str]
    rating: int | None
    evidence_url: str | None
    source: str
    created_at: datetime
    updated_at: datetime


class LearningHistoryPage(BaseModel):
    items: list[LearningHistoryResponse]
    total: int
    limit: int
    offset: int


class CsvPreviewRow(BaseModel):
    row_number: int
    status: str
    course: LearningHistoryCreate | None
    errors: list[str]


class CsvPreviewResponse(BaseModel):
    rows: list[CsvPreviewRow]
    ready_count: int
    invalid_count: int
    duplicate_count: int


class CsvImportResponse(BaseModel):
    imported_count: int
    rejected_count: int
    duplicate_count: int
    rows: list[CsvPreviewRow]

