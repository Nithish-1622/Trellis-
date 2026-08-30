"""Versioned, evidence-preserving automated resource quality evaluation."""

import asyncio
from datetime import datetime, timezone
import hashlib
import json
import logging
import math
from typing import Any, Protocol

import httpx
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field, ValidationError

from config import settings
from resource_providers import ExternalResource


logger = logging.getLogger(__name__)
SCORE_VERSION = "trellis-resource-score/v1"
_HALF_LIFE_YEARS = {"stable": 8.0, "moderate": 3.0, "fast_moving": 1.0}


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
    coverage: list[str] = Field(default_factory=list, max_length=30)


class TranscriptDocument(BaseModel):
    text: str = Field(min_length=1)
    language: str | None = None
    content_hash: str


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


class StructuredVettingModel(Protocol):
    async def ainvoke(self, prompt: str) -> ContentAnalysis | dict[str, Any]: ...


class TranscriptClient:
    def __init__(self, endpoint: str, api_key: str = "", transport: httpx.AsyncBaseTransport | None = None) -> None:
        self.endpoint = endpoint
        self.api_key = api_key
        self.transport = transport

    async def fetch(self, provider: str, external_id: str, language: str) -> TranscriptDocument | None:
        if not self.endpoint:
            return None
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=settings.TRANSCRIPT_TIMEOUT_SECONDS, transport=self.transport) as client:
                response = await client.get(
                    self.endpoint,
                    params={"provider": provider, "external_id": external_id, "language": language},
                    headers=headers,
                )
                response.raise_for_status()
            payload = response.json()
            if not payload.get("available") or not isinstance(payload.get("text"), str):
                return None
            text = payload["text"].strip()[:settings.VETTING_TRANSCRIPT_MAX_CHARS]
            if not text:
                return None
            return TranscriptDocument(
                text=text,
                language=payload.get("language"),
                content_hash=hashlib.sha256(text.encode("utf-8")).hexdigest(),
            )
        except (httpx.HTTPError, ValueError, ValidationError) as exc:
            logger.warning("Transcript provider failed: %s", type(exc).__name__)
            return None


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
    transcript_available: bool = False,
    transcript_language: str | None = None,
    transcript_content_hash: str | None = None,
    llm_used: bool = True,
    model_version: str | None = None,
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
    confidence = 0.42 + 0.18 * completeness + (0.22 if transcript_available else 0) + (0.12 if llm_used else 0)
    if not transcript_available:
        confidence = min(confidence, 0.55)
    if not llm_used:
        confidence = min(confidence, 0.45)
    confidence = round(min(confidence, 0.98), 3)

    safety_failure = analysis.promotional_content >= 70
    if safety_failure or final < settings.RESOURCE_DISCOVERED_SCORE_THRESHOLD:
        status = "rejected"
    elif final >= settings.RESOURCE_VETTED_SCORE_THRESHOLD and confidence >= settings.RESOURCE_MIN_CONFIDENCE:
        status = "vetted"
    else:
        status = "discovered"
    return EvaluationResult(
        relevance_score=relevance, content_quality_score=content, engagement_score=engagement,
        creator_score=creator, freshness_score=freshness, final_score=final, confidence=confidence,
        status=status, model_version=model_version, input_fingerprint=_fingerprint(candidate, context, analysis),
        transcript_available=transcript_available, transcript_language=transcript_language,
        transcript_content_hash=transcript_content_hash, coverage=analysis.coverage,
        evidence={
            "weights": {"relevance": 0.40, "content_quality": 0.20, "engagement": 0.15, "creator": 0.15, "freshness": 0.10},
            "analysis": analysis.model_dump(mode="json"), "metadata_only": not transcript_available,
            "safety_failure": safety_failure,
        },
    )


class ResourceVettingService:
    def __init__(self, model: StructuredVettingModel | None = None, transcript_client: TranscriptClient | None = None) -> None:
        self.model = model
        if self.model is None and settings.GROQ_API_KEY and settings.RESOURCE_VETTING_ENABLED:
            chat = ChatGroq(model=settings.GROQ_MODEL, api_key=settings.GROQ_API_KEY, temperature=0, timeout=10, max_retries=1)
            self.model = chat.with_structured_output(ContentAnalysis)
        self.transcript_client = transcript_client or TranscriptClient(settings.TRANSCRIPT_API_URL, settings.TRANSCRIPT_API_KEY)

    async def evaluate(self, candidate: ExternalResource, context: VettingContext) -> EvaluationResult:
        transcript = None
        if candidate.provider == "youtube" and self.transcript_client:
            transcript = await self.transcript_client.fetch(candidate.provider, candidate.external_id, candidate.language)
        evidence_text = transcript.text if transcript else (candidate.metadata.get("readme") or f"{candidate.title}\n{candidate.description or ''}")
        analysis = self._fallback_analysis(candidate, context)
        llm_used = False
        model_failed = False
        if self.model is not None:
            prompt = self._prompt(candidate, context, str(evidence_text)[:settings.VETTING_TRANSCRIPT_MAX_CHARS])
            try:
                raw = await asyncio.wait_for(self.model.ainvoke(prompt), timeout=12)
                analysis = raw if isinstance(raw, ContentAnalysis) else ContentAnalysis.model_validate(raw)
                llm_used = True
            except (TimeoutError, ValidationError, ValueError, TypeError) as exc:
                model_failed = True
                logger.warning("Resource evaluator rejected model output: %s", type(exc).__name__)
            except Exception as exc:
                model_failed = True
                logger.warning("Resource evaluator failed: %s", type(exc).__name__)
        result = score_resource(
            candidate, context, analysis, transcript_available=transcript is not None,
            transcript_language=transcript.language if transcript else None,
            transcript_content_hash=transcript.content_hash if transcript else None,
            llm_used=llm_used, model_version=settings.GROQ_MODEL if llm_used else None,
        )
        if model_failed and result.status == "vetted":
            result = result.model_copy(update={"status": "discovered", "evidence": {**result.evidence, "model_output_rejected": True}})
        return result

    @staticmethod
    def _fallback_analysis(candidate: ExternalResource, context: VettingContext) -> ContentAnalysis:
        content = f"{candidate.title} {candidate.description or ''} {' '.join(candidate.topics)}".casefold()
        skill_terms = [term for term in context.skill.casefold().replace("-", " ").split() if len(term) > 1]
        matched = sum(term in content for term in skill_terms)
        relevance = 45 + 45 * matched / max(len(skill_terms), 1)
        documentation = 75 if candidate.metadata.get("readme") else 62
        return ContentAnalysis(
            relevance=relevance, clarity=documentation, depth=documentation,
            practicality=82 if candidate.resource_type == "project" else 68,
            prerequisite_fit=65, outdated_risk=20, promotional_content=0,
            coverage=[context.skill] if matched else [],
        )

    @staticmethod
    def _prompt(candidate: ExternalResource, context: VettingContext, evidence: str) -> str:
        return (
            "Evaluate this learning resource on separate measurable 0-100 dimensions. Return only the required schema. "
            "Relevance measures whether it teaches the named skill and objective; clarity measures explanation quality; "
            "depth measures substantive coverage; practicality measures usable examples; prerequisite_fit measures fit for "
            "the target level; outdated_risk and promotional_content are risks. Do not infer facts absent from evidence.\n"
            f"Skill: {context.skill}\nLevel: {context.target_level or 'unspecified'}\nObjective: {context.objective or 'unspecified'}\n"
            f"Title: {candidate.title}\nDescription: {candidate.description or ''}\nEvidence:\n{evidence}"
        )


def get_resource_vetting_service() -> ResourceVettingService:
    return ResourceVettingService()
