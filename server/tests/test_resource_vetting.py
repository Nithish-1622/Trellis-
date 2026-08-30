from datetime import datetime, timedelta, timezone

import httpx
import pytest

from resource_providers import CreatorMetrics, ExternalResource, ResourceMetrics
from resource_vetting import (
    ContentAnalysis,
    ResourceVettingService,
    TranscriptClient,
    VettingContext,
    score_resource,
)


def youtube_candidate(*, published_at: datetime | None = None) -> ExternalResource:
    return ExternalResource(
        provider="youtube", external_id="video-1", resource_type="video", title="Spring Boot REST API",
        description="Build and test a production-style API", url="https://youtube.com/watch?v=video-1",
        author="Teacher", published_at=published_at or datetime.now(timezone.utc) - timedelta(days=180),
        duration_seconds=1800, topics=["Spring Boot", "REST APIs"],
        metrics=ResourceMetrics(views=100_000, likes=8_000, comments=600),
        creator_metrics=CreatorMetrics(followers=50_000, content_count=200, total_views=5_000_000),
    )


def strong_analysis() -> ContentAnalysis:
    return ContentAnalysis(
        relevance=94, clarity=88, depth=86, practicality=92, prerequisite_fit=90,
        outdated_risk=5, promotional_content=2, coverage=["dependency injection", "REST APIs"],
    )


def test_score_v1_is_reproducible_and_promotes_strong_evidence():
    context = VettingContext(skill="Spring Boot", target_level="intermediate", objective="Build APIs", freshness_class="fast_moving")
    now = datetime(2026, 8, 30, tzinfo=timezone.utc)

    first = score_resource(youtube_candidate(published_at=now - timedelta(days=100)), context, strong_analysis(), now=now, transcript_available=True, llm_used=True)
    second = score_resource(youtube_candidate(published_at=now - timedelta(days=100)), context, strong_analysis(), now=now, transcript_available=True, llm_used=True)

    assert first == second
    assert first.score_version == "trellis-resource-score/v1"
    assert first.status == "vetted"
    assert first.final_score >= 80
    assert first.confidence >= 0.45
    assert first.input_fingerprint == second.input_fingerprint


def test_metadata_only_and_no_llm_confidence_are_capped():
    context = VettingContext(skill="Spring Boot", objective="Build APIs")
    result = score_resource(youtube_candidate(), context, strong_analysis(), transcript_available=False, llm_used=False)

    assert result.confidence <= 0.45


def test_freshness_penalizes_fast_moving_topics_more_than_stable_topics():
    candidate = youtube_candidate(published_at=datetime(2020, 1, 1, tzinfo=timezone.utc))
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    stable = score_resource(candidate, VettingContext(skill="Algorithms", freshness_class="stable"), strong_analysis(), now=now)
    fast = score_resource(candidate, VettingContext(skill="Next.js", freshness_class="fast_moving"), strong_analysis(), now=now)

    assert stable.freshness_score > fast.freshness_score
    assert stable.final_score > fast.final_score


@pytest.mark.asyncio
async def test_transcript_client_uses_generic_authenticated_contract_without_persisting_raw_text():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer transcript-secret"
        assert request.url.params["provider"] == "youtube"
        assert request.url.params["external_id"] == "video-1"
        return httpx.Response(200, json={"available": True, "language": "en", "text": "Dependency injection explained."})

    client = TranscriptClient(endpoint="https://transcripts.example/v1/transcript", api_key="transcript-secret", transport=httpx.MockTransport(handler))
    transcript = await client.fetch("youtube", "video-1", "English")

    assert transcript is not None
    assert transcript.text == "Dependency injection explained."
    assert transcript.content_hash


@pytest.mark.asyncio
async def test_vetting_service_rejects_malformed_model_output_instead_of_promoting():
    class MalformedModel:
        async def ainvoke(self, _prompt: str):
            return {"relevance": 150, "clarity": "excellent"}

    service = ResourceVettingService(model=MalformedModel(), transcript_client=None)
    result = await service.evaluate(youtube_candidate(), VettingContext(skill="Spring Boot"))

    assert result.status != "vetted"
    assert result.confidence <= 0.45
