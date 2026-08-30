"""Authenticated learner recommendations and administrator catalog routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user, require_admin
from catalog_schemas import (
    RecommendationPage,
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
