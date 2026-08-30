"""Authenticated history import and resume-evidence endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from database import LearningHistory, get_db
from errors import APIError
from learning_history_schemas import (
    CsvImportResponse,
    CsvPreviewResponse,
    LearningHistoryCreate,
    LearningHistoryPage,
    LearningHistoryResponse,
)
from learning_history_service import LearningHistoryService, MAX_CSV_BYTES


router = APIRouter(prefix="/v1/me", tags=["learning history"])


@router.get("/learning-history", response_model=LearningHistoryPage)
def list_learning_history(
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> LearningHistoryPage:
    return LearningHistoryService(db).list(identity, limit, offset)


@router.post(
    "/learning-history",
    response_model=LearningHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_learning_history(
    course: LearningHistoryCreate,
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> LearningHistory:
    return LearningHistoryService(db).create(identity, course)


async def _read_csv(file: UploadFile) -> bytes:
    if file.content_type not in {"text/csv", "application/csv", "application/vnd.ms-excel"}:
        raise APIError(415, "UPLOAD_TYPE_INVALID", "Upload a CSV file")
    content = await file.read(MAX_CSV_BYTES + 1)
    if len(content) > MAX_CSV_BYTES:
        raise APIError(413, "UPLOAD_TOO_LARGE", "CSV files must be 1 MB or smaller")
    return content


@router.post("/learning-history/csv/preview", response_model=CsvPreviewResponse)
async def preview_learning_history_csv(
    file: Annotated[UploadFile, File(...)],
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CsvPreviewResponse:
    return LearningHistoryService(db).preview_csv(identity, await _read_csv(file))


@router.post("/learning-history/csv/import", response_model=CsvImportResponse)
async def import_learning_history_csv(
    file: Annotated[UploadFile, File(...)],
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    allow_partial: bool = Query(default=False),
) -> CsvImportResponse:
    return LearningHistoryService(db).import_csv(identity, await _read_csv(file), allow_partial)

