"""Authenticated learner profile and onboarding routes."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from database import get_db
from profile_schemas import (
    GoalAnalysisRequest,
    GoalAnalysisResponse,
    LearnerProfileResponse,
    OnboardingSessionResponse,
    OnboardingUpdate,
)
from profile_service import LearnerProfileService
from goal_analyzer import GoalAnalyzer, get_goal_analyzer
from rate_limit import SlidingWindowRateLimiter, get_expensive_operation_limiter
from resource_jobs import ResourceJobService


router = APIRouter(prefix="/v1/me", tags=["learner profile"])
logger = logging.getLogger(__name__)


@router.post("/onboarding/goal-analysis", response_model=GoalAnalysisResponse)
async def analyze_onboarding_goal(
    request: GoalAnalysisRequest,
    _identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    analyzer: Annotated[GoalAnalyzer, Depends(get_goal_analyzer)],
    limiter: Annotated[SlidingWindowRateLimiter, Depends(get_expensive_operation_limiter)],
) -> GoalAnalysisResponse:
    limiter.check(_identity.user_id, "goal_analysis")
    return await analyzer.analyze(request.goal)


@router.get("/onboarding", response_model=OnboardingSessionResponse)
def get_onboarding(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OnboardingSessionResponse:
    return LearnerProfileService(db).get_onboarding(identity)


@router.post("/onboarding", response_model=OnboardingSessionResponse)
def save_onboarding(
    update: OnboardingUpdate,
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OnboardingSessionResponse:
    service = LearnerProfileService(db)
    session = service.save_onboarding(identity, update)
    if update.complete:
        profile = service.ensure_profile(identity)
        try:
            ResourceJobService(db).enqueue_discovery(identity.user_id, profile.profile_version)
        except Exception as exc:
            db.rollback()
            logger.warning("Unable to enqueue onboarding resource discovery: %s", type(exc).__name__)
    return session


@router.get("/profile", response_model=LearnerProfileResponse)
def get_profile(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LearnerProfileResponse:
    return LearnerProfileService(db).get_profile(identity)
