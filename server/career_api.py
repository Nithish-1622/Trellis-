"""Authenticated career recommendation and evidence endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from career_schemas import ApplicationCreate, ApplicationResponse, InterviewAnswer, InterviewInteraction, InterviewReport, InterviewStart, JobRecommendationPage
from career_service import CareerService, JSearchJobProvider, JobProvider
from database import get_db


router = APIRouter(prefix="/v1/career", tags=["career evidence"])


def get_job_provider() -> JobProvider:
    return JSearchJobProvider()


@router.get("/jobs", response_model=JobRecommendationPage)
async def jobs(identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)], provider: Annotated[JobProvider, Depends(get_job_provider)], limit: Annotated[int, Query(ge=1, le=25)] = 10) -> JobRecommendationPage:
    return await CareerService(db).jobs(identity, provider, limit)


@router.post("/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(request: ApplicationCreate, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> ApplicationResponse:
    return CareerService(db).create_application(identity, request)


@router.post("/interviews", response_model=InterviewInteraction, status_code=status.HTTP_201_CREATED)
def start_interview(request: InterviewStart, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> InterviewInteraction:
    return CareerService(db).start_interview(identity, request)


@router.post("/interviews/{session_id}/answers", response_model=InterviewInteraction)
def answer_interview(session_id: str, request: InterviewAnswer, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> InterviewInteraction:
    return CareerService(db).answer_interview(identity, session_id, request)


@router.get("/interviews/{session_id}", response_model=InterviewReport)
def interview_report(session_id: str, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> InterviewReport:
    return CareerService(db).interview(identity, session_id)
