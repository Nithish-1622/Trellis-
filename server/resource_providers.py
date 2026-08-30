"""Bounded provider adapters that return validated, canonical candidates."""

import asyncio
import base64
from dataclasses import dataclass
from datetime import datetime
from html import unescape
import logging
import re
import time
from typing import Any, Protocol
from urllib.parse import parse_qs, urlsplit

import httpx
from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, ValidationError, model_validator

from config import settings
from telemetry import metrics


logger = logging.getLogger(__name__)
_DURATION_PATTERN = re.compile(r"^P(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$")
_SPAM_MARKERS = ("guaranteed income", "get rich quick", "free crypto", "click my bio")


class ProviderSearchRequest(BaseModel):
    skill: str = Field(min_length=1, max_length=120)
    target_level: str | None = Field(default=None, max_length=40)
    objective: str | None = Field(default=None, max_length=300)
    language: str = Field(default="English", max_length=40)
    resource_intent: str | None = Field(default=None, max_length=40)

    def query(self) -> str:
        return " ".join(part for part in (self.skill, self.target_level, self.resource_intent, self.objective) if part)[:300]


class ResourceMetrics(BaseModel):
    views: int | None = Field(default=None, ge=0)
    likes: int | None = Field(default=None, ge=0)
    comments: int | None = Field(default=None, ge=0)
    stars: int | None = Field(default=None, ge=0)
    forks: int | None = Field(default=None, ge=0)


class CreatorMetrics(BaseModel):
    followers: int | None = Field(default=None, ge=0)
    content_count: int | None = Field(default=None, ge=0)
    total_views: int | None = Field(default=None, ge=0)
    created_at: datetime | None = None


class ExternalResource(BaseModel):
    provider: str
    external_id: str
    canonical_key: str | None = None
    resource_type: str
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    url: AnyHttpUrl
    thumbnail_url: AnyHttpUrl | None = None
    author: str | None = Field(default=None, max_length=300)
    published_at: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    topics: list[str] = Field(default_factory=list)
    language: str = "English"
    metrics: ResourceMetrics = Field(default_factory=ResourceMetrics)
    creator_metrics: CreatorMetrics = Field(default_factory=CreatorMetrics)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def populate_canonical_key(self) -> "ExternalResource":
        derived_key = canonical_resource_key(self.provider, self.external_id, str(self.url))
        if self.canonical_key and self.canonical_key != derived_key:
            raise ValueError("Canonical identity does not match provider resource URL")
        self.canonical_key = derived_key
        return self


def canonical_resource_key(provider: str, external_id: str | None, url: str) -> str:
    source = provider.strip().casefold()
    parsed = urlsplit(url)
    hostname = (parsed.hostname or "").casefold()
    if source == "youtube":
        if hostname not in {"youtu.be", "www.youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com"}:
            raise ValueError("YouTube resources must use a YouTube URL")
        url_video_id = None
        if hostname in {"youtu.be", "www.youtu.be"}:
            url_video_id = parsed.path.strip("/").split("/")[0]
        else:
            if parsed.path == "/watch":
                url_video_id = parse_qs(parsed.query).get("v", [None])[0]
            elif parsed.path.startswith(("/embed/", "/shorts/")):
                url_video_id = parsed.path.split("/")[2]
        if not url_video_id or (external_id and external_id != url_video_id):
            raise ValueError("YouTube external identity does not match its URL")
        return f"youtube:{url_video_id}"
    if source == "github":
        if hostname not in {"github.com", "www.github.com"}:
            raise ValueError("GitHub resources must use a GitHub URL")
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2:
            repository = f"{parts[0].casefold()}/{parts[1].removesuffix('.git').casefold()}"
            if external_id and external_id.strip().removesuffix(".git").casefold() != repository:
                raise ValueError("GitHub external identity does not match its URL")
            return f"github:{repository}"
        raise ValueError("GitHub resource URL must identify a repository")
    if not external_id:
        raise ValueError("Provider resource requires a canonical external identity")
    return f"{source}:{external_id.strip().casefold()}"


def _integer(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return max(int(value), 0)


def _duration_seconds(value: str | None) -> int | None:
    if not value:
        return None
    match = _DURATION_PATTERN.fullmatch(value)
    if not match:
        return None
    hours, minutes, seconds = (int(part or 0) for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def _language_matches(requested: str, actual: str | None) -> bool:
    if not actual or requested.casefold() == "english":
        return not actual or actual.casefold().startswith("en")
    return actual.casefold().startswith(requested.casefold()[:2])


def _looks_spammy(title: str, description: str | None) -> bool:
    content = f"{title} {description or ''}".casefold()
    return any(marker in content for marker in _SPAM_MARKERS)


class ResourceProvider(Protocol):
    async def search(self, request: ProviderSearchRequest | str, limit: int) -> list[ExternalResource]: ...


@dataclass
class YouTubeProvider:
    api_key: str
    transport: httpx.AsyncBaseTransport | None = None

    async def search(self, request: ProviderSearchRequest | str, limit: int) -> list[ExternalResource]:
        if not self.api_key:
            return []
        search_request = request if isinstance(request, ProviderSearchRequest) else ProviderSearchRequest(skill=request)
        bounded_limit = min(max(limit, 1), settings.RESOURCE_DISCOVERY_PROVIDER_LIMIT)
        async with httpx.AsyncClient(timeout=settings.PROVIDER_TIMEOUT_SECONDS, transport=self.transport) as client:
            search_response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={"part": "snippet", "q": search_request.query(), "type": "video", "maxResults": bounded_limit,
                        "safeSearch": "strict", "videoEmbeddable": "true", "relevanceLanguage": search_request.language[:2].casefold(), "key": self.api_key},
            )
            search_response.raise_for_status()
            search_items = search_response.json().get("items", [])
            video_ids = [item.get("id", {}).get("videoId") for item in search_items]
            video_ids = [video_id for video_id in video_ids if video_id]
            if not video_ids:
                return []
            detail_response = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={"part": "snippet,contentDetails,statistics,status", "id": ",".join(video_ids), "key": self.api_key},
            )
            detail_response.raise_for_status()
            detail_items = detail_response.json().get("items", [])
            channel_ids = sorted({item.get("snippet", {}).get("channelId") for item in detail_items if item.get("snippet", {}).get("channelId")})
            channels: dict[str, dict[str, Any]] = {}
            if channel_ids:
                channel_response = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "snippet,statistics", "id": ",".join(channel_ids), "key": self.api_key},
                )
                channel_response.raise_for_status()
                channels = {item.get("id", ""): item for item in channel_response.json().get("items", [])}

        results: list[ExternalResource] = []
        for item in detail_items:
            candidate = self._normalize(item, channels, search_request)
            if candidate:
                results.append(candidate)
        return results[:bounded_limit]

    @staticmethod
    def _normalize(item: dict[str, Any], channels: dict[str, dict[str, Any]], request: ProviderSearchRequest) -> ExternalResource | None:
        video_id = item.get("id")
        snippet = item.get("snippet") or {}
        status = item.get("status") or {}
        seconds = _duration_seconds((item.get("contentDetails") or {}).get("duration"))
        title = unescape(str(snippet.get("title") or "")).strip()
        description = unescape(str(snippet.get("description") or ""))[:5000] or None
        if not video_id or not title or status.get("privacyStatus") != "public" or status.get("uploadStatus") != "processed":
            return None
        if status.get("embeddable") is False or snippet.get("liveBroadcastContent", "none") != "none":
            return None
        if seconds is None or not settings.YOUTUBE_MIN_DURATION_SECONDS <= seconds <= settings.YOUTUBE_MAX_DURATION_SECONDS:
            return None
        language = snippet.get("defaultAudioLanguage") or snippet.get("defaultLanguage")
        if not _language_matches(request.language, language) or _looks_spammy(title, description):
            return None
        thumbnails = snippet.get("thumbnails") or {}
        thumbnail = (thumbnails.get("medium") or thumbnails.get("default") or {}).get("url")
        statistics = item.get("statistics") or {}
        channel = channels.get(snippet.get("channelId"), {})
        channel_statistics = channel.get("statistics") or {}
        channel_snippet = channel.get("snippet") or {}
        return ExternalResource(
            provider="youtube", external_id=video_id, canonical_key=f"youtube:{video_id}", resource_type="video",
            title=title, description=description, url=f"https://www.youtube.com/watch?v={video_id}", thumbnail_url=thumbnail,
            author=snippet.get("channelTitle"), published_at=snippet.get("publishedAt"), duration_seconds=seconds,
            language=language or request.language, topics=[request.skill],
            metrics=ResourceMetrics(views=_integer(statistics.get("viewCount")), likes=_integer(statistics.get("likeCount")), comments=_integer(statistics.get("commentCount"))),
            creator_metrics=CreatorMetrics(followers=_integer(channel_statistics.get("subscriberCount")), content_count=_integer(channel_statistics.get("videoCount")), total_views=_integer(channel_statistics.get("viewCount")), created_at=channel_snippet.get("publishedAt")),
            metadata={"channel_id": snippet.get("channelId"), "validation": "youtube-details/v1"},
        )


class GitHubRepository(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: int
    full_name: str
    html_url: AnyHttpUrl
    description: str | None = None
    stargazers_count: int = 0
    forks_count: int = 0
    language: str | None = None
    topics: list[str] = Field(default_factory=list)
    archived: bool = False
    disabled: bool = False
    size: int = 0
    pushed_at: datetime | None = None
    created_at: datetime | None = None
    license: dict[str, Any] | None = None


@dataclass
class GitHubProvider:
    token: str = ""
    transport: httpx.AsyncBaseTransport | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "trellis-learning-recommender"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def search(self, request: ProviderSearchRequest | str, limit: int) -> list[ExternalResource]:
        search_request = request if isinstance(request, ProviderSearchRequest) else ProviderSearchRequest(skill=request)
        bounded_limit = min(max(limit, 1), settings.RESOURCE_DISCOVERY_PROVIDER_LIMIT)
        headers = self._headers()
        async with httpx.AsyncClient(timeout=settings.PROVIDER_TIMEOUT_SECONDS, transport=self.transport) as client:
            response = await client.get(
                "https://api.github.com/search/repositories", headers=headers,
                params={"q": f"{search_request.query()} in:name,description,readme archived:false", "sort": "stars", "order": "desc", "per_page": bounded_limit, "page": 1},
            )
            response.raise_for_status()
            repositories = [GitHubRepository.model_validate(item) for item in response.json().get("items", [])]
            results: list[ExternalResource] = []
            for repository in repositories:
                candidate = await self._validate_and_normalize(client, headers, repository, search_request)
                if candidate:
                    results.append(candidate)
            return results

    @staticmethod
    async def _validate_and_normalize(client: httpx.AsyncClient, headers: dict[str, str], repository: GitHubRepository, request: ProviderSearchRequest) -> ExternalResource | None:
        if repository.archived or repository.disabled or repository.size <= 0:
            return None
        if urlsplit(str(repository.html_url)).hostname != "github.com":
            return None
        readme_response = await client.get(f"https://api.github.com/repos/{repository.full_name}/readme", headers=headers)
        if readme_response.status_code == 404:
            return None
        readme_response.raise_for_status()
        readme_payload = readme_response.json()
        if readme_payload.get("encoding") != "base64" or not readme_payload.get("content"):
            return None
        try:
            encoded_readme = "".join(str(readme_payload["content"]).split())
            readme = base64.b64decode(encoded_readme, validate=True).decode("utf-8", errors="replace")[:20_000]
        except (ValueError, TypeError):
            return None
        if not readme.strip():
            return None
        language_response = await client.get(f"https://api.github.com/repos/{repository.full_name}/languages", headers=headers)
        language_response.raise_for_status()
        languages = language_response.json()
        if not isinstance(languages, dict) or not languages:
            return None
        topics = list(dict.fromkeys([*repository.topics, *languages.keys(), request.skill]))
        return ExternalResource(
            provider="github", external_id=repository.full_name.casefold(),
            canonical_key=canonical_resource_key("github", None, str(repository.html_url)), resource_type="project",
            title=repository.full_name, description=repository.description, url=repository.html_url, author=repository.full_name.split("/", 1)[0],
            published_at=repository.pushed_at or repository.created_at, topics=topics, language=request.language,
            metrics=ResourceMetrics(stars=repository.stargazers_count, forks=repository.forks_count),
            creator_metrics=CreatorMetrics(created_at=repository.created_at),
            metadata={"readme": readme, "languages": languages, "last_activity_at": repository.pushed_at.isoformat() if repository.pushed_at else None, "has_license": repository.license is not None, "validation": "github-repository/v1"},
        )


class HybridResourceProvider:
    def __init__(self, providers: list[ResourceProvider], ttl_seconds: int = 900) -> None:
        self.providers = providers
        self.ttl_seconds = ttl_seconds
        self._cache: dict[tuple[str, int], tuple[float, list[ExternalResource]]] = {}
        self._failures: dict[int, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def search(self, request: ProviderSearchRequest | str, limit: int) -> list[ExternalResource]:
        search_request = request if isinstance(request, ProviderSearchRequest) else ProviderSearchRequest(skill=request)
        bounded_limit = min(max(limit, 1), settings.RESOURCE_DISCOVERY_PROVIDER_LIMIT)
        cache_key = (search_request.model_dump_json(), bounded_limit)
        cached = self._cache.get(cache_key)
        if cached and cached[0] > time.monotonic():
            return cached[1]
        async with self._lock:
            cached = self._cache.get(cache_key)
            if cached and cached[0] > time.monotonic():
                return cached[1]
            groups = await asyncio.gather(*(self._safe_search(provider, search_request, bounded_limit) for provider in self.providers))
            deduplicated: dict[str, ExternalResource] = {}
            for index in range(max((len(group) for group in groups), default=0)):
                for group in groups:
                    if index < len(group):
                        item = group[index]
                        deduplicated.setdefault(item.canonical_key, item)
            results = list(deduplicated.values())[:bounded_limit]
            self._cache[cache_key] = (time.monotonic() + self.ttl_seconds, results)
            return results

    async def _safe_search(self, provider: ResourceProvider, request: ProviderSearchRequest, limit: int) -> list[ExternalResource]:
        provider_name = provider.__class__.__name__.removesuffix("Provider").casefold()
        started = time.perf_counter()
        provider_key = id(provider)
        failure_count, open_until = self._failures.get(provider_key, (0, 0.0))
        if open_until > time.monotonic():
            return []
        for attempt in range(2):
            try:
                results = await provider.search(request, limit)
                self._failures.pop(provider_key, None)
                metrics.observe(f"provider.{provider_name}", (time.perf_counter() - started) * 1000)
                return results
            except (httpx.HTTPError, ValidationError, ValueError, TypeError, AttributeError) as exc:
                if attempt == 1:
                    failure_count += 1
                    open_until = 0.0
                    if failure_count >= settings.PROVIDER_CIRCUIT_BREAKER_FAILURES:
                        open_until = time.monotonic() + settings.PROVIDER_CIRCUIT_BREAKER_SECONDS
                    self._failures[provider_key] = (failure_count, open_until)
                    logger.warning("Resource provider failed: %s", type(exc).__name__)
                    metrics.observe(f"provider.{provider_name}", (time.perf_counter() - started) * 1000, failed=True)
        return []


_hybrid_provider = HybridResourceProvider([YouTubeProvider(settings.YOUTUBE_API_KEY), GitHubProvider(settings.GITHUB_TOKEN)])


def get_hybrid_resource_provider() -> HybridResourceProvider:
    return _hybrid_provider
