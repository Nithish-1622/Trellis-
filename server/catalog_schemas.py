"""Typed contracts for verified learning resources and recommendations."""

from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field


ResourceType = Literal["course", "video", "project", "article", "assessment"]
VerificationStatus = Literal["pending", "verified", "rejected"]


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
    verification_status: VerificationStatus = "pending"
    metadata: dict = Field(default_factory=dict)


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
    verification_status: VerificationStatus | None = None
    metadata: dict | None = None


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    provider: str
    external_id: str | None
    resource_type: str
    title: str
    description: str | None
    level: str | None
    duration_minutes: int | None
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
    explanation: str
    provenance: str
    prerequisite_status: str


class RecommendationPage(BaseModel):
    items: list[ResourceRecommendation]
    total: int
    limit: int
    offset: int
