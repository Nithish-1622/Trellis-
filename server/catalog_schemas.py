"""Typed contracts for verified learning resources and recommendations."""

from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator


ResourceType = Literal["course", "video", "project", "article", "assessment"]
VerificationStatus = Literal["verified", "vetted", "discovered", "rejected"]
ExceptionCategory = Literal["reports", "low_confidence_high_score", "score_drop", "stale", "heavily_used", "unusual_new_creator"]


class ResourceCreate(BaseModel):
    provider: str = Field(min_length=1, max_length=200)
    external_id: str | None = Field(default=None, max_length=300)
    resource_type: ResourceType
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    level: Literal["beginner", "intermediate", "advanced", "all"] | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=100_000)
    topics: list[str] = Field(default_factory=list, max_length=50)
    prerequisites: list[str] = Field(default_factory=list, max_length=50)
    cost_type: Literal["free", "paid", "subscription"] = "free"
    price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    language: str = Field(default="English", min_length=1, max_length=100)
    url: AnyHttpUrl
    thumbnail_url: AnyHttpUrl | None = None
    verification_status: VerificationStatus = "discovered"
    moderation_reason: str | None = Field(default=None, min_length=10, max_length=1000)
    metadata: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_trust_reason(self) -> "ResourceCreate":
        if self.verification_status in {"verified", "rejected"} and not self.moderation_reason:
            raise ValueError("A moderation reason is required for verified or rejected resources")
        return self


class ResourceUpdate(BaseModel):
    provider: str | None = Field(default=None, min_length=1, max_length=200)
    external_id: str | None = Field(default=None, max_length=300)
    resource_type: ResourceType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    level: Literal["beginner", "intermediate", "advanced", "all"] | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=100_000)
    topics: list[str] | None = Field(default=None, max_length=50)
    prerequisites: list[str] | None = Field(default=None, max_length=50)
    cost_type: Literal["free", "paid", "subscription"] | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    language: str | None = Field(default=None, min_length=1, max_length=100)
    url: AnyHttpUrl | None = None
    thumbnail_url: AnyHttpUrl | None = None
    metadata: dict | None = None


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    provider: str
    external_id: str | None
    canonical_key: str | None
    resource_type: str
    title: str
    description: str | None
    level: str | None
    duration_minutes: int | None
    duration_seconds: int | None
    author: str | None
    published_at: datetime | None
    topics: list[str]
    prerequisites: list[str]
    cost_type: str
    price: float | None
    currency: str | None
    language: str
    url: str
    thumbnail_url: str | None
    verification_status: str
    verified_by: str | None
    verified_at: datetime | None
    archived_at: datetime | None
    link_status: str
    resource_score: float | None
    score_confidence: float | None
    score_version: str | None
    freshness_class: str
    last_evaluated_at: datetime | None
    is_pinned: bool
    score_override: float | None
    override_reason: str | None
    suppressed_at: datetime | None
    metadata: dict = Field(validation_alias="resource_metadata")
    created_at: datetime
    updated_at: datetime


class ResourcePage(BaseModel):
    items: list[ResourceResponse]
    total: int
    limit: int
    offset: int


class ResourceRecommendation(ResourceResponse):
    score: float
    confidence: float
    skills: list[str]
    source: str
    status: str
    why_recommended: list[str]
    explanation: str
    provenance: str
    prerequisite_status: str


class RecommendationPage(BaseModel):
    items: list[ResourceRecommendation]
    total: int
    limit: int
    offset: int


class ResourceBulkCreate(BaseModel):
    resources: list[ResourceCreate] = Field(min_length=1, max_length=500)


class ProviderSyncRequest(BaseModel):
    query: str = Field(min_length=2, max_length=200)
    limit: int = Field(default=10, ge=1, le=25)


class ImportResult(BaseModel):
    created: int
    skipped: int
    items: list[ResourceResponse]


class DiscoveryJobResponse(BaseModel):
    id: str
    status: str
    progress: int
    profile_version: int
    coverage: list[dict] = Field(default_factory=list)
    coverage_gaps: list[str] = Field(default_factory=list)
    failure_code: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


InteractionType = Literal["impression", "open", "helpful", "not_helpful", "report"]


class ResourceInteractionCreate(BaseModel):
    event_type: InteractionType
    idempotency_key: str = Field(min_length=8, max_length=120, pattern=r"^[A-Za-z0-9._:-]+$")
    session_id: str | None = Field(default=None, max_length=120)
    milestone_id: str | None = Field(default=None, max_length=100)
    report_reason: str | None = Field(default=None, min_length=5, max_length=1000)

    @model_validator(mode="after")
    def require_report_reason(self) -> "ResourceInteractionCreate":
        if self.event_type == "report" and not self.report_reason:
            raise ValueError("A report reason is required")
        if self.event_type != "report" and self.report_reason:
            raise ValueError("A report reason is only accepted for report events")
        return self


class ResourceInteractionResponse(BaseModel):
    id: str
    resource_id: str
    event_type: InteractionType
    created: bool
    created_at: datetime


class ResourceModerationRequest(BaseModel):
    action: Literal["verify", "reject", "pin", "unpin", "suppress", "unsuppress", "score_override", "clear_score_override"]
    reason: str = Field(min_length=10, max_length=1000)
    score: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_score_action(self) -> "ResourceModerationRequest":
        if self.action == "score_override" and self.score is None:
            raise ValueError("A score is required for score_override")
        if self.action != "score_override" and self.score is not None:
            raise ValueError("A score is only accepted for score_override")
        return self


class ResourceEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evaluation_version: str
    relevance_score: float
    content_quality_score: float
    engagement_score: float
    creator_score: float
    freshness_score: float
    final_score: float
    confidence: float
    model_version: str | None
    input_fingerprint: str
    evidence: dict
    evaluated_at: datetime


class ResourceEvaluationPage(BaseModel):
    items: list[ResourceEvaluationResponse]
    total: int
    limit: int
    offset: int


class ReevaluationRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=1000)
