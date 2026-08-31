from datetime import datetime, timedelta, timezone

import pytest
from resource_providers import CreatorMetrics, ExternalResource, ResourceMetrics
from resource_vetting import (
    ContentAnalysis,
    ResourceVettingService,
    SCORE_VERSION,
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


def test_current_score_is_reproducible_and_promotes_strong_evidence():
    context = VettingContext(skill="Spring Boot", target_level="intermediate", objective="Build APIs", freshness_class="fast_moving")
    now = datetime(2026, 8, 30, tzinfo=timezone.utc)

    first = score_resource(youtube_candidate(published_at=now - timedelta(days=100)), context, strong_analysis(), now=now)
    second = score_resource(youtube_candidate(published_at=now - timedelta(days=100)), context, strong_analysis(), now=now)

    assert first == second
    assert first.score_version == SCORE_VERSION
    assert first.status == "vetted"
    assert first.final_score >= 80
    assert first.confidence >= 0.45
    assert first.input_fingerprint == second.input_fingerprint


def test_metadata_only_scoring_has_enough_confidence_for_verified_provider_metadata():
    context = VettingContext(skill="Spring Boot", objective="Build APIs")
    result = score_resource(youtube_candidate(), context, strong_analysis())

    assert result.confidence >= 0.45
    assert result.model_version is None
    assert result.evidence["method"] == "deterministic_metadata"


def test_metadata_scored_youtube_video_uses_the_youtube_admission_threshold(monkeypatch):
    monkeypatch.setattr("resource_vetting.settings.YOUTUBE_METADATA_ELIGIBLE_SCORE_THRESHOLD", 70)
    analysis = ContentAnalysis(
        relevance=75, clarity=80, depth=80, practicality=80,
        prerequisite_fit=80, outdated_risk=10, promotional_content=0,
        coverage=["Spring Boot"],
    )

    result = score_resource(
        youtube_candidate(), VettingContext(skill="Spring Boot"), analysis,
        now=datetime.now(timezone.utc),
    )

    assert 70 <= result.final_score < 80
    assert result.status == "vetted"


def test_content_analysis_strict_schema_requires_every_property():
    schema = ContentAnalysis.model_json_schema()

    assert set(schema["required"]) == set(schema["properties"])


def test_freshness_penalizes_fast_moving_topics_more_than_stable_topics():
    candidate = youtube_candidate(published_at=datetime(2020, 1, 1, tzinfo=timezone.utc))
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    stable = score_resource(candidate, VettingContext(skill="Algorithms", freshness_class="stable"), strong_analysis(), now=now)
    fast = score_resource(candidate, VettingContext(skill="Next.js", freshness_class="fast_moving"), strong_analysis(), now=now)

    assert stable.freshness_score > fast.freshness_score
    assert stable.final_score > fast.final_score


@pytest.mark.asyncio
async def test_vetting_service_promotes_strong_youtube_metadata_without_calling_a_model():
    service = ResourceVettingService()
    result = await service.evaluate(youtube_candidate(), VettingContext(skill="Spring Boot"))

    assert result.status == "vetted"
    assert result.model_version is None
    assert result.transcript_available is False
    assert result.evidence["method"] == "deterministic_metadata"


@pytest.mark.asyncio
async def test_vetting_service_does_not_promote_an_off_topic_popular_video():
    candidate = youtube_candidate().model_copy(update={
        "title": "How to plan your career",
        "description": "General advice about setting professional goals.",
        "topics": [],
    })

    result = await ResourceVettingService().evaluate(candidate, VettingContext(skill="Spring Boot"))

    assert result.status != "vetted"
    assert result.coverage == []
