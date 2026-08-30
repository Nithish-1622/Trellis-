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


learner_router = APIRouter(prefix="/v1/resources", tags=["learning resources"])
admin_router = APIRouter(prefix="/v1/admin/resources", tags=["catalog administration"])


@learner_router.get("/recommendations", response_model=RecommendationPage)
def get_recommendations(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    resource_type: ResourceType | None = None,
) -> RecommendationPage:
    return CatalogService(db).recommendations(identity, limit, offset, resource_type)


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

