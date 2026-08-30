import httpx
import pytest

from resource_providers import GitHubProvider, HybridResourceProvider, YouTubeProvider


@pytest.mark.asyncio
async def test_youtube_provider_constructs_urls_only_from_video_ids():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["type"] == "video"
        assert request.url.params["safeSearch"] == "strict"
        return httpx.Response(200, json={"items": [{"id": {"videoId": "abc123"}, "snippet": {"title": "FastAPI testing", "description": "A practical guide", "channelTitle": "Example", "thumbnails": {"medium": {"url": "https://i.ytimg.com/vi/abc123/mqdefault.jpg"}}}}, {"id": {}, "snippet": {"title": "invalid"}}]})

    provider = YouTubeProvider(api_key="test-key", transport=httpx.MockTransport(handler))
    results = await provider.search("FastAPI", 5)

    assert len(results) == 1
    assert str(results[0].url) == "https://www.youtube.com/watch?v=abc123"
    assert results[0].external_id == "abc123"


@pytest.mark.asyncio
async def test_github_provider_rejects_non_github_repository_urls():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["accept"] == "application/vnd.github+json"
        return httpx.Response(200, json={"total_count": 2, "incomplete_results": False, "items": [
            {"id": 10, "full_name": "example/fastapi-project", "html_url": "https://github.com/example/fastapi-project", "description": "Practice APIs", "stargazers_count": 400, "language": "Python", "topics": ["fastapi", "learning"]},
            {"id": 11, "full_name": "unsafe/project", "html_url": "https://attacker.example/project", "description": "unsafe", "stargazers_count": 500, "language": "Python", "topics": []},
        ]})

    provider = GitHubProvider(token="test-token", transport=httpx.MockTransport(handler))
    results = await provider.search("FastAPI", 5)

    assert [str(item.url) for item in results] == ["https://github.com/example/fastapi-project"]
    assert results[0].metadata["stars"] == 400


@pytest.mark.asyncio
async def test_hybrid_provider_falls_back_when_live_providers_fail():
    class FailingProvider:
        async def search(self, _query: str, _limit: int):
            raise httpx.TimeoutException("timeout")

    hybrid = HybridResourceProvider([FailingProvider(), FailingProvider()])

    assert await hybrid.search("backend engineering", 10) == []
