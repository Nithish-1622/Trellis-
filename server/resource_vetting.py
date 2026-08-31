"""Versioned, deterministic resource quality evaluation from provider metadata."""

from datetime import datetime, timezone
import hashlib
import json
import math
import re
from typing import Any

from pydantic import BaseModel, Field

from config import settings
from resource_providers import ExternalResource
from resource_policy import automatic_score_threshold


SCORE_VERSION = "trellis-resource-score/v3"
_HALF_LIFE_YEARS = {"stable": 8.0, "moderate": 3.0, "fast_moving": 1.0}
_PRACTICAL_MARKERS = ("build", "course", "example", "guide", "hands-on", "project", "tutorial", "workshop")
_PROMOTIONAL_MARKERS = ("buy now", "guaranteed", "limited time", "sponsored", "use my code")


class VettingContext(BaseModel):
    skill: str = Field(min_length=1, max_length=120)
    target_level: str | None = Field(default=None, max_length=40)
    objective: str | None = Field(default=None, max_length=300)
    freshness_class: str = Field(default="moderate", pattern="^(stable|moderate|fast_moving)$")


class ContentAnalysis(BaseModel):
    relevance: float = Field(ge=0, le=100)
    clarity: float = Field(ge=0, le=100)
    depth: float = Field(ge=0, le=100)
    practicality: float = Field(ge=0, le=100)
    prerequisite_fit: float = Field(ge=0, le=100)
    outdated_risk: float = Field(ge=0, le=100)
    promotional_content: float = Field(ge=0, le=100)
    coverage: list[str] = Field(max_length=30)


class EvaluationResult(BaseModel):
    score_version: str = SCORE_VERSION
    relevance_score: float
    content_quality_score: float
    engagement_score: float
    creator_score: float
    freshness_score: float
    final_score: float
    confidence: float
    status: str
    model_version: str | None = None
    input_fingerprint: str
    transcript_available: bool
    transcript_language: str | None = None
    transcript_content_hash: str | None = None
    coverage: list[str] = Field(default_factory=list)
    evidence: dict[str, Any] = Field(default_factory=dict)


def _bounded_score(value: float) -> float:
    return round(min(max(value, 0.0), 100.0), 3)


def _age_days(published_at: datetime | None, now: datetime) -> float:
    if published_at is None:
        return 365.25 * 5
    published = published_at if published_at.tzinfo else published_at.replace(tzinfo=timezone.utc)
    return max((now - published).total_seconds() / 86400, 1.0)


def _engagement_score(candidate: ExternalResource, age_days: float) -> float:
    metrics = candidate.metrics
    if candidate.provider == "youtube":
        views = metrics.views or 0
        views_per_day = views / age_days
        velocity = min(math.log10(views_per_day + 1) / 4, 1.0)
        like_rate = min((metrics.likes or 0) / max(views, 1) / 0.08, 1.0)
        comment_rate = min((metrics.comments or 0) / max(views, 1) / 0.01, 1.0)
        return _bounded_score(100 * (0.45 * velocity + 0.4 * like_rate + 0.15 * comment_rate))
    stars = metrics.stars or 0
    forks = metrics.forks or 0
    star_signal = min(math.log10(stars + 1) / 4, 1.0)
    fork_quality = min(forks / max(stars, 1) / 0.25, 1.0)
    return _bounded_score(100 * (0.75 * star_signal + 0.25 * fork_quality))


def _creator_score(candidate: ExternalResource) -> float:
    creator = candidate.creator_metrics
    if candidate.provider == "youtube":
        followers = min(math.log10((creator.followers or 0) + 1) / 6, 1.0)
        history = min(math.log10((creator.content_count or 0) + 1) / 3, 1.0)
        reach = min(math.log10((creator.total_views or 0) + 1) / 8, 1.0)
        return _bounded_score(100 * (0.4 * followers + 0.35 * history + 0.25 * reach))
    documentation = 1.0 if candidate.metadata.get("readme") else 0.0
    license_signal = 1.0 if candidate.metadata.get("has_license") else 0.45
    languages = min(len(candidate.metadata.get("languages") or {}) / 3, 1.0)
    return _bounded_score(100 * (0.5 * documentation + 0.25 * license_signal + 0.25 * languages))


def _freshness_score(candidate: ExternalResource, freshness_class: str, now: datetime) -> float:
    age_years = _age_days(candidate.published_at, now) / 365.25
    half_life = _HALF_LIFE_YEARS[freshness_class]
    return _bounded_score(100 * math.pow(0.5, age_years / half_life))


def _fingerprint(candidate: ExternalResource, context: VettingContext, analysis: ContentAnalysis) -> str:
    value = {
        "score_version": SCORE_VERSION,
        "candidate": candidate.model_dump(mode="json", exclude_none=True),
        "context": context.model_dump(mode="json"),
        "analysis": analysis.model_dump(mode="json"),
    }
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def score_resource(
    candidate: ExternalResource,
    context: VettingContext,
    analysis: ContentAnalysis,
    *,
    now: datetime | None = None,
) -> EvaluationResult:
    evaluated_at = now or datetime.now(timezone.utc)
    age_days = _age_days(candidate.published_at, evaluated_at)
    relevance = _bounded_score(analysis.relevance)
    content = _bounded_score((analysis.clarity + analysis.depth + analysis.practicality + analysis.prerequisite_fit) / 4)
    engagement = _engagement_score(candidate, age_days)
    creator = _creator_score(candidate)
    freshness = _freshness_score(candidate, context.freshness_class, evaluated_at)
    final = _bounded_score(0.40 * relevance + 0.20 * content + 0.15 * engagement + 0.15 * creator + 0.10 * freshness)

    completeness = sum((candidate.description is not None, candidate.published_at is not None, any(value is not None for value in candidate.metrics.model_dump().values()), candidate.author is not None)) / 4
    authoritative_provider = candidate.provider in {"youtube", "github"} and candidate.metadata.get("validation") is not None
    confidence = round(min(0.5 + 0.2 * completeness + (0.1 if authoritative_provider else 0), 0.8), 3)

    safety_failure = analysis.promotional_content >= 70
    relevance_failure = relevance < 60 or not analysis.coverage
    if safety_failure or relevance_failure or final < settings.RESOURCE_DISCOVERED_SCORE_THRESHOLD:
        status = "rejected"
    elif final >= automatic_score_threshold(candidate.provider) and confidence >= settings.RESOURCE_MIN_CONFIDENCE:
        status = "vetted"
    else:
        status = "discovered"
    return EvaluationResult(
        relevance_score=relevance, content_quality_score=content, engagement_score=engagement,
        creator_score=creator, freshness_score=freshness, final_score=final, confidence=confidence,
        status=status, model_version=None, input_fingerprint=_fingerprint(candidate, context, analysis),
        transcript_available=False, coverage=analysis.coverage,
        evidence={
            "weights": {"relevance": 0.40, "content_quality": 0.20, "engagement": 0.15, "creator": 0.15, "freshness": 0.10},
            "analysis": analysis.model_dump(mode="json"), "metadata_only": True,
            "method": "deterministic_metadata",
            "safety_failure": safety_failure,
            "relevance_failure": relevance_failure,
        },
    )


class ResourceVettingService:
    async def evaluate(self, candidate: ExternalResource, context: VettingContext) -> EvaluationResult:
        return score_resource(candidate, context, self._metadata_analysis(candidate, context))

    @staticmethod
    def _metadata_analysis(candidate: ExternalResource, context: VettingContext) -> ContentAnalysis:
        title = candidate.title.casefold()
        description = (candidate.description or "").casefold()
        skill_terms = set(re.findall(r"[a-z0-9+#.]+", context.skill.casefold()))
        title_match = sum(term in title for term in skill_terms) / max(len(skill_terms), 1)
        description_match = sum(term in description for term in skill_terms) / max(len(skill_terms), 1)
        relevance = 55 + 35 * title_match + 10 * description_match
        description_quality = min(len(description) / 240, 1)
        duration_minutes = (candidate.duration_seconds or 0) / 60
        depth = 82 if duration_minutes >= 15 or candidate.metadata.get("readme") else 68
        practicality = 88 if any(marker in f"{title} {description}" for marker in _PRACTICAL_MARKERS) else 72
        promotion = 80 if any(marker in f"{title} {description}" for marker in _PROMOTIONAL_MARKERS) else 0
        return ContentAnalysis(
            relevance=relevance,
            clarity=72 + 16 * description_quality,
            depth=depth,
            practicality=practicality,
            prerequisite_fit=82 if context.target_level and context.target_level.casefold() in f"{title} {description}" else 76,
            outdated_risk=0,
            promotional_content=promotion,
            coverage=[context.skill] if title_match or description_match else [],
        )


def get_resource_vetting_service() -> ResourceVettingService:
    return ResourceVettingService()
