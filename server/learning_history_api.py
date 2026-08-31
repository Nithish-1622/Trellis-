"""Authenticated history import and resume-evidence endpoints."""

import math
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
    ResumeCapabilitiesResponse,
    ResumeSkillSuggestion,
)
from learning_history_service import LearningHistoryService, MAX_CSV_BYTES
from resume_parser import resume_parser


MAX_RESUME_BYTES = 5_000_000
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
RESUME_FILE_SIGNATURES = {
    "application/pdf": b"%PDF-",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": b"PK\x03\x04",
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


def _clean_optional_text(value: object, limit: int) -> str | None:
    text = str(value).strip() if value is not None else ""
    return text[:limit] or None


def _resume_skills(raw_skills: object) -> list[ResumeSkillSuggestion]:
    if not isinstance(raw_skills, list):
        return []
    suggestions: list[ResumeSkillSuggestion] = []
    seen: set[str] = set()
    allowed_levels = {"beginner", "intermediate", "advanced", "expert"}
    for raw_skill in raw_skills:
        if isinstance(raw_skill, dict):
            name = _clean_optional_text(raw_skill.get("name"), 100)
            level = str(raw_skill.get("proficiency", "beginner")).casefold()
            rationale = _clean_optional_text(raw_skill.get("rationale"), 500)
        else:
            name = _clean_optional_text(raw_skill, 100)
            level = "beginner"
            rationale = None
        canonical_name = name.casefold() if name else ""
        if not name or canonical_name in seen:
            continue
        seen.add(canonical_name)
        suggestions.append(ResumeSkillSuggestion(
            name=name,
            proficiency=level if level in allowed_levels else "beginner",
            rationale=rationale,
        ))
        if len(suggestions) == 50:
            break
    return suggestions


def _resume_list(raw_values: object, *, object_key: str | None = None) -> list[str]:
    if not isinstance(raw_values, list):
        return []
    values: list[str] = []
    for raw_value in raw_values:
        value = raw_value.get(object_key) if object_key and isinstance(raw_value, dict) else raw_value
        text = _clean_optional_text(value, 200)
        if text and text.casefold() not in {item.casefold() for item in values}:
            values.append(text)
        if len(values) == 20:
            break
    return values


@router.post("/resume/parse", response_model=ResumeCapabilitiesResponse)
async def parse_resume_evidence(
    file: Annotated[UploadFile, File(...)],
    identity: Annotated[AuthenticatedUser, Depends(get_current_user)],
    parser: Annotated[ResumeParserProtocol, Depends(get_resume_parser)],
    resume_file_id: Annotated[str | None, Form()] = None,
) -> ResumeCapabilitiesResponse:
    if file.content_type not in ALLOWED_RESUME_TYPES:
        raise APIError(status_code=415, code="UPLOAD_TYPE_INVALID", message="Upload a PDF or DOCX resume")
    content = await file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise APIError(status_code=413, code="UPLOAD_TOO_LARGE", message="Resume files must be 5 MB or smaller")
    expected_signature = RESUME_FILE_SIGNATURES[file.content_type]
    if not content.startswith(expected_signature):
        raise APIError(
            status_code=415,
            code="UPLOAD_CONTENT_INVALID",
            message="The file content does not match the declared resume type",
        )

    parsed = await parser.parse_resume(content, file.content_type or "")
    experience_years = parsed.get("experience_years")
    try:
        numeric_experience = float(experience_years) if experience_years is not None else None
        experience_years = (
            min(max(numeric_experience, 0), 80)
            if numeric_experience is not None and math.isfinite(numeric_experience)
            else None
        )
    except (TypeError, ValueError):
        experience_years = None
    return ResumeCapabilitiesResponse(
        filename=(file.filename or "resume")[:255],
        resume_file_id=_clean_optional_text(resume_file_id, 255),
        current_role=_clean_optional_text(parsed.get("current_role"), 200),
        experience_years=experience_years,
        education_level=_clean_optional_text(parsed.get("education_level"), 200),
        skills=_resume_skills(parsed.get("skills")),
        certifications=_resume_list(parsed.get("certifications")),
        projects=_resume_list(parsed.get("projects"), object_key="name"),
    )
