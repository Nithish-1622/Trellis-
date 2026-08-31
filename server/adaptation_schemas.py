"""Contracts for learner-confirmed roadmap adaptation proposals."""

from datetime import datetime

from pydantic import BaseModel, Field


class AdaptationRequest(BaseModel):
    evidence_ids: list[str] = Field(default_factory=list, max_length=100)


class AdaptationDecision(BaseModel):
    feedback: str | None = Field(default=None, max_length=5000)


class AdaptationResponse(BaseModel):
    id: str
    roadmap_id: str
    base_version_id: str
    proposed_version_id: str
    status: str
    diff: dict
    evidence_ids: list[str]
    feedback: str | None
    created_at: datetime
    decided_at: datetime | None
