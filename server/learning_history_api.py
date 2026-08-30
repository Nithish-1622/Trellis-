"""Authenticated history import and resume-evidence endpoints."""

from typing import Annotated, Protocol

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
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
    ResumeEvidenceResponse,
)
from learning_history_service import LearningHistoryService, MAX_CSV_BYTES
from profile_service import LearnerProfileService
from resume_parser import resume_parser


MAX_RESUME_BYTES = 5_000_000
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class ResumeParserProtocol(Protocol):
    async def parse_resume(self, content: bytes, content_type: str) -> dict: ...


def get_resume_parser() -> ResumeParserProtocol:
    return resume_parser


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
        raise APIError(status_code=415, code="UPLOAD_TYPE_INVALID", message="Upload a CSV file")
    content = await file.read(MAX_CSV_BYTES + 1)
    if len(content) > MAX_CSV_BYTES:
        raise APIError(status_code=413, code="UPLOAD_TOO_LARGE", message="CSV files must be 1 MB or smaller")
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


@router.post("/resume/parse", response_model=ResumeEvidenceResponse)
async def parse_resume_evidence(
    file: Annotated[UploadFile, File(...)],
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    parser: Annotated[ResumeParserProtocol, Depends(get_resume_parser)],
    resume_file_id: Annotated[str | None, Form()] = None,
) -> ResumeEvidenceResponse:
    if file.content_type not in ALLOWED_RESUME_TYPES:
        raise APIError(status_code=415, code="UPLOAD_TYPE_INVALID", message="Upload a PDF or DOCX resume")
    content = await file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise APIError(status_code=413, code="UPLOAD_TOO_LARGE", message="Resume files must be 5 MB or smaller")

    parsed = await parser.parse_resume(content, file.content_type or "")
    skills = [str(skill).strip() for skill in parsed.get("skills", []) if str(skill).strip()][:100]
    profile_service = LearnerProfileService(db)
    profile = profile_service.ensure_profile(identity)
    profile.resume_filename = (file.filename or "resume")[:255]
    profile.resume_file_id = resume_file_id
    added = profile_service.add_resume_evidence(identity.user_id, skills)
    db.commit()
    return ResumeEvidenceResponse(
        filename=profile.resume_filename,
        skills_found=skills,
        skills_added=added,
        evidence_count=len(skills),
        education_count=len(parsed.get("education", [])),
        experience_count=len(parsed.get("experience", [])),
    )
