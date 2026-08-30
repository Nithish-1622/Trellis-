"""Authenticated learner recommendations and administrator catalog routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
import asyncio
import ipaddress
import socket
from typing import Protocol
from urllib.parse import urlsplit

import httpx
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user, require_admin
from catalog_schemas import (
    DiscoveryJobResponse,
    RecommendationPage,
    ImportResult,
    ResourceBulkCreate,
    ResourceCreate,
    ResourcePage,
    ResourceResponse,
    ResourceType,
    ResourceUpdate,
)
from catalog_service import CatalogService
from database import ResourceJob, get_db
from errors import APIError
from profile_service import LearnerProfileService
from resource_providers import ExternalResource, HybridResourceProvider, get_hybrid_resource_provider
from resource_jobs import ResourceJobService
from rate_limit import SlidingWindowRateLimiter, get_expensive_operation_limiter


learner_router = APIRouter(prefix="/v1/resources", tags=["learning resources"])
admin_router = APIRouter(prefix="/v1/admin/resources", tags=["catalog administration"])


class LinkChecker(Protocol):
    async def check(self, url: str) -> str: ...


class PublicLinkChecker:
    async def check(self, url: str) -> str:
        parsed = urlsplit(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return "invalid"
        try:
            address = ipaddress.ip_address(parsed.hostname)
            if not address.is_global:
                return "blocked"
        except ValueError:
            try:
                addresses = await asyncio.to_thread(socket.getaddrinfo, parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
            except socket.gaierror:
                return "unreachable"
            if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
                return "blocked"
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
                response = await client.head(url)
            return "healthy" if response.status_code < 400 else "unhealthy"
        except httpx.HTTPError:
            return "unreachable"


def get_link_checker() -> LinkChecker:
    return PublicLinkChecker()


@learner_router.get("/recommendations", response_model=RecommendationPage)
def get_recommendations(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    resource_type: ResourceType | None = None,
    include_live: Annotated[bool | None, Query(deprecated=True)] = None,
) -> RecommendationPage:
    del include_live
    return CatalogService(db).recommendations(identity, limit, offset, resource_type)


def _job_response(job: ResourceJob) -> DiscoveryJobResponse:
    result = job.result or {}
    return DiscoveryJobResponse(
        id=job.id, status=job.status, progress=job.progress,
        profile_version=int((job.payload or {}).get("profile_version", 0)),
        coverage=result.get("coverage", []), coverage_gaps=result.get("coverage_gaps", []),
        failure_code=job.last_error_code, created_at=job.created_at, completed_at=job.completed_at,
    )


@learner_router.post("/discover", response_model=DiscoveryJobResponse, status_code=status.HTTP_202_ACCEPTED)
def discover_resources(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limiter: Annotated[SlidingWindowRateLimiter, Depends(get_expensive_operation_limiter)],
) -> DiscoveryJobResponse:
    limiter.check(identity.user_id, "resource_discovery")
    profile = LearnerProfileService(db).ensure_profile(identity)
    if profile.onboarding_completed_at is None:
        raise APIError(status_code=409, code="ONBOARDING_REQUIRED", message="Complete onboarding before discovering resources")
    return _job_response(ResourceJobService(db).enqueue_discovery(identity.user_id, profile.profile_version))


@learner_router.get("/discovery-jobs/{job_id}", response_model=DiscoveryJobResponse)
def get_discovery_job(
    job_id: str,
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DiscoveryJobResponse:
    job = db.query(ResourceJob).filter_by(id=job_id, user_id=identity.user_id, job_type="discovery").first()
    if job is None:
        raise APIError(status_code=404, code="DISCOVERY_JOB_NOT_FOUND", message="Discovery job was not found")
    return _job_response(job)


@admin_router.get("/provider-preview", response_model=list[ExternalResource])
async def preview_provider_resources(
    query: Annotated[str, Query(min_length=2, max_length=200)],
    _admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    provider: Annotated[HybridResourceProvider, Depends(get_hybrid_resource_provider)],
    limiter: Annotated[SlidingWindowRateLimiter, Depends(get_expensive_operation_limiter)],
    limit: Annotated[int, Query(ge=1, le=25)] = 10,
) -> list[ExternalResource]:
    limiter.check(_admin.user_id, "provider_preview")
    return await provider.search(query, limit)


@admin_router.get("", response_model=ResourcePage)
def list_resources(
    _admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ResourcePage:
    return CatalogService(db).list_admin(limit, offset)


@admin_router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: ResourceCreate,
    admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ResourceResponse:
    return CatalogService(db).create(admin, payload)


@admin_router.post("/bulk", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
def bulk_create_resources(
    payload: ResourceBulkCreate,
    admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ImportResult:
    return CatalogService(db).bulk_create(admin, payload)


@admin_router.post("/{resource_id}/check-link", response_model=ResourceResponse)
async def check_resource_link(
    resource_id: str,
    _admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    checker: Annotated[LinkChecker, Depends(get_link_checker)],
) -> ResourceResponse:
    service = CatalogService(db)
    resource = service._get(resource_id)
    return service.set_link_status(resource_id, await checker.check(resource.url))


@admin_router.patch("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: str,
    payload: ResourceUpdate,
    admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ResourceResponse:
    return CatalogService(db).update(admin, resource_id, payload)


@admin_router.delete("/{resource_id}", response_model=ResourceResponse)
def archive_resource(
    resource_id: str,
    _admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ResourceResponse:
    return CatalogService(db).archive(resource_id)
