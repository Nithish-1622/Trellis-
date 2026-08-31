"""Authenticated versioned roadmap endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from database import get_db
from roadmap_engine import RoadmapService
from roadmap_schemas import MilestoneCompletion, MilestoneProgressUpdate, MilestoneResponse, RoadmapCreate, RoadmapResponse


router = APIRouter(prefix="/v1/roadmaps", tags=["roadmaps"])


@router.post("", response_model=RoadmapResponse, status_code=status.HTTP_201_CREATED)
def create_roadmap(request: RoadmapCreate, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> RoadmapResponse:
    return RoadmapService(db).create(identity, request)


@router.get("/current", response_model=RoadmapResponse)
def get_current_roadmap(identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> RoadmapResponse:
    return RoadmapService(db).current(identity)


@router.post("/{roadmap_id}/refresh-resources", response_model=RoadmapResponse)
def refresh_roadmap_resources(roadmap_id: str, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> RoadmapResponse:
    return RoadmapService(db).refresh_resources(identity, roadmap_id)


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(roadmap_id: str, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> RoadmapResponse:
    return RoadmapService(db).get(identity, roadmap_id)


@router.patch("/{roadmap_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(roadmap_id: str, milestone_id: str, update: MilestoneProgressUpdate, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> MilestoneResponse:
    return RoadmapService(db).update_milestone(identity, roadmap_id, milestone_id, update)


@router.post("/{roadmap_id}/milestones/{milestone_id}/complete", response_model=MilestoneResponse)
def complete_milestone(roadmap_id: str, milestone_id: str, completion: MilestoneCompletion, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> MilestoneResponse:
    return RoadmapService(db).complete_milestone(identity, roadmap_id, milestone_id, completion)
