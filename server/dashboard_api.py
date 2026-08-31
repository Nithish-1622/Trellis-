"""Authenticated learner skills and dashboard endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from dashboard_schemas import DashboardResponse, SkillPage
from dashboard_service import DashboardService
from database import get_db


router = APIRouter(prefix="/v1/me", tags=["dashboard"])


@router.get("/skills", response_model=SkillPage)
def get_skills(identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> SkillPage:
    return DashboardService(db).skills(identity)


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> DashboardResponse:
    return DashboardService(db).dashboard(identity)
