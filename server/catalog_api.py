"""Authenticated learner recommendations and administrator catalog routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
import ipaddress
from typing import Protocol
from urllib.parse import urlsplit

import httpx
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user, require_admin
from catalog_schemas import (
    RecommendationPage,
    ImportResult,
    ProviderSyncRequest,
    ResourceBulkCreate,
    ResourceCreate,
    ResourcePage,
    ResourceResponse,
    ResourceType,
    ResourceUpdate,
)
from catalog_service import CatalogService
from database import get_db
from profile_service import LearnerProfileService
from resource_providers import ExternalResource, HybridResourceProvider, get_hybrid_resource_provider


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
            pass
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
                response = await client.head(url)
            return "healthy" if response.status_code < 400 else "unhealthy"
        except httpx.HTTPError:
            return "unreachable"


def get_link_checker() -> LinkChecker:
    return PublicLinkChecker()


@learner_router.get("/recommendations", response_model=RecommendationPage)
async def get_recommendations(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    provider: Annotated[HybridResourceProvider, Depends(get_hybrid_resource_provider)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    resource_type: ResourceType | None = None,
    include_live: bool = True,
) -> RecommendationPage:
    service = CatalogService(db)
    catalog_page = service.recommendations(identity, limit, offset, resource_type)
    if not include_live or offset > 0:
        return catalog_page
    profile = LearnerProfileService(db).ensure_profile(identity)
    query = " ".join(part for part in [profile.target_role, profile.objective] if part) or "practical learning project"
    external = await provider.search(query, min(limit, 10))
    if resource_type:
        external = [item for item in external if item.resource_type == resource_type]
    return service.merge_external(catalog_page, external, limit)


@admin_router.get("/provider-preview", response_model=list[ExternalResource])
async def preview_provider_resources(
    query: Annotated[str, Query(min_length=2, max_length=200)],
    _admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    provider: Annotated[HybridResourceProvider, Depends(get_hybrid_resource_provider)],
    limit: Annotated[int, Query(ge=1, le=25)] = 10,
) -> list[ExternalResource]:
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


@admin_router.post("/provider-sync", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def sync_provider_resources(
    payload: ProviderSyncRequest,
    admin: Annotated[AuthenticatedUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    provider: Annotated[HybridResourceProvider, Depends(get_hybrid_resource_provider)],
) -> ImportResult:
    return CatalogService(db).sync_external(admin, await provider.search(payload.query, payload.limit))


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
