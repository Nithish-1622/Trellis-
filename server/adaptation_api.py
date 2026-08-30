"""Authenticated learner-controlled roadmap adaptation endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from adaptation_schemas import AdaptationDecision, AdaptationRequest, AdaptationResponse
from adaptation_service import AdaptationService
from auth import AuthenticatedUser, get_current_user
from database import get_db
from telemetry import metrics


roadmap_router = APIRouter(prefix="/v1/roadmaps", tags=["adaptation"])
adaptation_router = APIRouter(prefix="/v1/adaptations", tags=["adaptation"])


@roadmap_router.post("/{roadmap_id}/adaptations", response_model=AdaptationResponse, status_code=status.HTTP_201_CREATED)
def create_adaptation(roadmap_id: str, request: AdaptationRequest, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> AdaptationResponse:
    return AdaptationService(db).create(identity, roadmap_id, request)


@adaptation_router.get("/pending", response_model=AdaptationResponse)
def get_pending_adaptation(identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> AdaptationResponse:
    return AdaptationService(db).pending(identity)


@adaptation_router.post("/{proposal_id}/accept", response_model=AdaptationResponse)
def accept_adaptation(proposal_id: str, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> AdaptationResponse:
    result = AdaptationService(db).accept(identity, proposal_id)
    metrics.increment("adaptation.accepted")
    return result


@adaptation_router.post("/{proposal_id}/reject", response_model=AdaptationResponse)
def reject_adaptation(proposal_id: str, decision: AdaptationDecision, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> AdaptationResponse:
    result = AdaptationService(db).reject(identity, proposal_id, decision.feedback)
    metrics.increment("adaptation.rejected")
    return result
