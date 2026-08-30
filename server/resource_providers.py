"""Bounded, validated adapters for live supplemental learning resources."""

import asyncio
from dataclasses import dataclass
from html import unescape
import logging
import time
from typing import Any, Protocol
from urllib.parse import urlsplit

import httpx
from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, ValidationError

from config import settings
from telemetry import metrics


logger = logging.getLogger(__name__)


class ExternalResource(BaseModel):
    provider: str
    external_id: str
    resource_type: str
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    url: AnyHttpUrl
    thumbnail_url: AnyHttpUrl | None = None
    topics: list[str] = Field(default_factory=list)
    language: str = "English"
    metadata: dict[str, Any] = Field(default_factory=dict)


class YouTubeId(BaseModel):
    video_id: str | None = Field(default=None, alias="videoId")


class YouTubeThumbnail(BaseModel):
    url: AnyHttpUrl


class YouTubeThumbnails(BaseModel):
    medium: YouTubeThumbnail | None = None
    default: YouTubeThumbnail | None = None


class YouTubeSnippet(BaseModel):
    title: str
    description: str = ""
    channel_title: str = Field(default="", alias="channelTitle")
    thumbnails: YouTubeThumbnails = Field(default_factory=YouTubeThumbnails)


class YouTubeItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: YouTubeId
    snippet: YouTubeSnippet


class YouTubeResponse(BaseModel):
    items: list[YouTubeItem] = Field(default_factory=list)


class GitHubRepository(BaseModel):
    id: int
    full_name: str
    html_url: AnyHttpUrl
    description: str | None = None
    stargazers_count: int = 0
    language: str | None = None
    topics: list[str] = Field(default_factory=list)


class GitHubResponse(BaseModel):
    total_count: int
    incomplete_results: bool
    items: list[GitHubRepository] = Field(default_factory=list)


class ResourceProvider(Protocol):
    async def search(self, query: str, limit: int) -> list[ExternalResource]: ...


@dataclass
class YouTubeProvider:
    api_key: str
    transport: httpx.AsyncBaseTransport | None = None

    async def search(self, query: str, limit: int) -> list[ExternalResource]:
        if not self.api_key:
            return []
        async with httpx.AsyncClient(timeout=settings.PROVIDER_TIMEOUT_SECONDS, transport=self.transport) as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={"part": "snippet", "q": query, "type": "video", "maxResults": min(max(limit, 1), 25), "safeSearch": "strict", "relevanceLanguage": "en", "key": self.api_key},
            )
            response.raise_for_status()
        payload = YouTubeResponse.model_validate(response.json())
        results: list[ExternalResource] = []
        for item in payload.items:
            if not item.id.video_id:
                continue
            thumbnail = item.snippet.thumbnails.medium or item.snippet.thumbnails.default
            results.append(ExternalResource(
                provider="youtube", external_id=item.id.video_id, resource_type="video",
                title=unescape(item.snippet.title), description=unescape(item.snippet.description)[:5000] or None,
                url=f"https://www.youtube.com/watch?v={item.id.video_id}",
                thumbnail_url=thumbnail.url if thumbnail else None, topics=[],
                metadata={"channel": item.snippet.channel_title},
            ))
        return results


@dataclass
class GitHubProvider:
    token: str = ""
    transport: httpx.AsyncBaseTransport | None = None

    async def search(self, query: str, limit: int) -> list[ExternalResource]:
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "trellis-learning-recommender"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        async with httpx.AsyncClient(timeout=settings.PROVIDER_TIMEOUT_SECONDS, transport=self.transport) as client:
            response = await client.get(
                "https://api.github.com/search/repositories", headers=headers,
                params={"q": f"{query} in:name,description,readme stars:>20 archived:false", "sort": "stars", "order": "desc", "per_page": min(max(limit, 1), 25), "page": 1},
            )
            response.raise_for_status()
        payload = GitHubResponse.model_validate(response.json())
        results: list[ExternalResource] = []
        for item in payload.items:
            if urlsplit(str(item.html_url)).hostname != "github.com":
                continue
            topics = [*(item.topics or [])]
            if item.language:
                topics.append(item.language)
            results.append(ExternalResource(
                provider="github", external_id=str(item.id), resource_type="project", title=item.full_name,
                description=item.description, url=item.html_url, topics=list(dict.fromkeys(topics)),
                metadata={"stars": item.stargazers_count, "incomplete_results": payload.incomplete_results},
            ))
        return results


class HybridResourceProvider:
    def __init__(self, providers: list[ResourceProvider], ttl_seconds: int = 900) -> None:
        self.providers = providers
        self.ttl_seconds = ttl_seconds
        self._cache: dict[tuple[str, int], tuple[float, list[ExternalResource]]] = {}
        self._lock = asyncio.Lock()

    async def search(self, query: str, limit: int) -> list[ExternalResource]:
        normalized_query = " ".join(query.split())[:200]
        bounded_limit = min(max(limit, 1), 25)
        cache_key = (normalized_query.casefold(), bounded_limit)
        cached = self._cache.get(cache_key)
        if cached and cached[0] > time.monotonic():
            return cached[1]
        async with self._lock:
            cached = self._cache.get(cache_key)
            if cached and cached[0] > time.monotonic():
                return cached[1]
            groups = await asyncio.gather(*(self._safe_search(provider, normalized_query, bounded_limit) for provider in self.providers))
            deduplicated: dict[str, ExternalResource] = {}
            for item in (item for group in groups for item in group):
                deduplicated.setdefault(str(item.url), item)
            results = list(deduplicated.values())[:bounded_limit]
            self._cache[cache_key] = (time.monotonic() + self.ttl_seconds, results)
            return results

    @staticmethod
    async def _safe_search(provider: ResourceProvider, query: str, limit: int) -> list[ExternalResource]:
        provider_name = provider.__class__.__name__.removesuffix("Provider").casefold()
        started = time.perf_counter()
        for attempt in range(2):
            try:
                results = await provider.search(query, limit)
                metrics.observe(f"provider.{provider_name}", (time.perf_counter() - started) * 1000)
                return results
            except (httpx.HTTPError, ValidationError, ValueError) as exc:
                if attempt == 1:
                    logger.warning("Resource provider failed: %s", type(exc).__name__)
                    metrics.observe(f"provider.{provider_name}", (time.perf_counter() - started) * 1000, failed=True)
        return []


_hybrid_provider = HybridResourceProvider([YouTubeProvider(settings.YOUTUBE_API_KEY), GitHubProvider(settings.GITHUB_TOKEN)])


def get_hybrid_resource_provider() -> HybridResourceProvider:
    return _hybrid_provider
