from datetime import datetime, timezone

import httpx
import pytest

from resource_providers import (
    GitHubProvider,
    HybridResourceProvider,
    ProviderSearchRequest,
    YouTubeProvider,
    canonical_resource_key,
)


def test_canonical_resource_keys_collapse_provider_url_variants():
    assert canonical_resource_key("youtube", "abc123", "https://youtu.be/abc123") == "youtube:abc123"
    assert canonical_resource_key("youtube", None, "https://www.youtube.com/embed/abc123") == "youtube:abc123"
    assert canonical_resource_key("github", None, "https://github.com/Example/Project.git") == "github:example/project"


@pytest.mark.asyncio
async def test_youtube_provider_fetches_details_and_rejects_unusable_videos():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/search"):
            assert request.url.params["type"] == "video"
            assert request.url.params["videoEmbeddable"] == "true"
            return httpx.Response(200, json={"items": [
                {"id": {"videoId": "good"}, "snippet": {"title": "Spring APIs"}},
                {"id": {"videoId": "live"}, "snippet": {"title": "Live stream"}},
                {"id": {"videoId": "private"}, "snippet": {"title": "Private"}},
            ]})
        if request.url.path.endswith("/videos"):
            assert request.url.params["part"] == "snippet,contentDetails,statistics,status"
            return httpx.Response(200, json={"items": [
                {
                    "id": "good",
                    "snippet": {"title": "Spring APIs", "description": "Build a REST API", "channelId": "channel-1", "channelTitle": "Teacher", "publishedAt": "2026-01-01T00:00:00Z", "defaultLanguage": "en", "liveBroadcastContent": "none", "thumbnails": {}},
                    "contentDetails": {"duration": "PT20M"},
                    "statistics": {"viewCount": "1000", "likeCount": "75", "commentCount": "12"},
                    "status": {"uploadStatus": "processed", "privacyStatus": "public", "embeddable": True},
                },
                {
                    "id": "live", "snippet": {"title": "Live stream", "channelId": "channel-1", "liveBroadcastContent": "live"},
                    "contentDetails": {"duration": "PT30M"}, "statistics": {},
                    "status": {"uploadStatus": "processed", "privacyStatus": "public", "embeddable": True},
                },
                {
                    "id": "private", "snippet": {"title": "Private", "channelId": "channel-1"},
                    "contentDetails": {"duration": "PT20M"}, "statistics": {},
                    "status": {"uploadStatus": "processed", "privacyStatus": "private", "embeddable": True},
                },
            ]})
        assert request.url.path.endswith("/channels")
        return httpx.Response(200, json={"items": [{
            "id": "channel-1", "snippet": {"publishedAt": "2020-01-01T00:00:00Z"},
            "statistics": {"subscriberCount": "5000", "videoCount": "120", "viewCount": "200000"},
        }]})

    provider = YouTubeProvider(api_key="test-key", transport=httpx.MockTransport(handler))
    results = await provider.search(ProviderSearchRequest(skill="Spring Boot", objective="Build APIs"), 5)

    assert len(results) == 1
    result = results[0]
    assert result.canonical_key == "youtube:good"
    assert result.duration_seconds == 1200
    assert result.author == "Teacher"
    assert result.metrics.views == 1000
    assert result.creator_metrics.followers == 5000
    assert result.published_at == datetime(2026, 1, 1, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_github_provider_rejects_archived_empty_and_readme_less_repositories():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/search/repositories":
            return httpx.Response(200, json={"total_count": 4, "incomplete_results": False, "items": [
                {"id": 10, "full_name": "example/good", "html_url": "https://github.com/example/good", "description": "Practice APIs", "stargazers_count": 400, "forks_count": 30, "language": "Java", "topics": ["spring"], "archived": False, "disabled": False, "size": 120, "pushed_at": "2026-08-01T00:00:00Z", "created_at": "2023-01-01T00:00:00Z", "license": None},
                {"id": 11, "full_name": "example/archived", "html_url": "https://github.com/example/archived", "archived": True, "disabled": False, "size": 50},
                {"id": 12, "full_name": "example/empty", "html_url": "https://github.com/example/empty", "archived": False, "disabled": False, "size": 0},
                {"id": 13, "full_name": "example/no-readme", "html_url": "https://github.com/example/no-readme", "archived": False, "disabled": False, "size": 50},
            ]})
        if request.url.path == "/repos/example/good/readme":
            return httpx.Response(200, json={"content": "IyBHb29kIHByb2plY3Q=", "encoding": "base64"})
        if request.url.path == "/repos/example/good/languages":
            return httpx.Response(200, json={"Java": 1000})
        if request.url.path == "/repos/example/no-readme/readme":
            return httpx.Response(404)
        raise AssertionError(f"Unexpected request: {request.url}")

    provider = GitHubProvider(token="test-token", transport=httpx.MockTransport(handler))
    results = await provider.search(ProviderSearchRequest(skill="Spring Boot"), 5)

    assert len(results) == 1
    assert results[0].canonical_key == "github:example/good"
    assert results[0].metadata["readme"] == "# Good project"
    assert results[0].metadata["has_license"] is False
    assert results[0].metrics.stars == 400


@pytest.mark.asyncio
async def test_hybrid_provider_falls_back_when_live_providers_fail():
    class FailingProvider:
        async def search(self, _request, _limit):
            raise httpx.TimeoutException("timeout")

    hybrid = HybridResourceProvider([FailingProvider(), FailingProvider()])

    assert await hybrid.search(ProviderSearchRequest(skill="backend engineering"), 10) == []
