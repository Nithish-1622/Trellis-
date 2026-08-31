"""Authenticated milestone assessment endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from assessment_schemas import AssessmentAttemptResponse, ProjectSubmissionRequest, QuizAttemptRequest, QuizResponse
from assessment_service import AssessmentService, ProjectGrader, get_project_grader
from auth import AuthenticatedUser, get_current_user
from database import get_db


router = APIRouter(prefix="/v1/assessments/milestones", tags=["assessments"])


@router.get("/{milestone_id}/quiz", response_model=QuizResponse)
def get_quiz(milestone_id: str, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> QuizResponse:
    return AssessmentService(db).quiz(identity, milestone_id)


@router.post("/{milestone_id}/quiz-attempts", response_model=AssessmentAttemptResponse, status_code=status.HTTP_201_CREATED)
def submit_quiz(milestone_id: str, request: QuizAttemptRequest, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> AssessmentAttemptResponse:
    return AssessmentService(db).submit_quiz(identity, milestone_id, request)


@router.post("/{milestone_id}/project-submissions", response_model=AssessmentAttemptResponse, status_code=status.HTTP_201_CREATED)
async def submit_project(milestone_id: str, request: ProjectSubmissionRequest, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)], grader: Annotated[ProjectGrader, Depends(get_project_grader)]) -> AssessmentAttemptResponse:
    return await AssessmentService(db).submit_project(identity, milestone_id, request, grader)
