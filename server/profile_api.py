"""Authenticated learner profile and onboarding routes."""

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


router = APIRouter(prefix="/v1/me", tags=["learner profile"])


@router.post("/onboarding/goal-analysis", response_model=GoalAnalysisResponse)
async def analyze_onboarding_goal(
    request: GoalAnalysisRequest,
    _identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    analyzer: Annotated[GoalAnalyzer, Depends(get_goal_analyzer)],
) -> GoalAnalysisResponse:
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
    return LearnerProfileService(db).save_onboarding(identity, update)


@router.get("/profile", response_model=LearnerProfileResponse)
def get_profile(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LearnerProfileResponse:
    return LearnerProfileService(db).get_profile(identity)
