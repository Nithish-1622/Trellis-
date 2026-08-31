"""Learner-owned history persistence and defensive CSV parsing."""

from __future__ import annotations

import csv
from datetime import date, datetime, time
from io import StringIO
import uuid

from pydantic import ValidationError
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from database import LearningHistory
from errors import APIError
from learning_history_schemas import (
    CsvImportResponse,
    CsvPreviewResponse,
    CsvPreviewRow,
    LearningHistoryCreate,
    LearningHistoryPage,
    LearningHistoryResponse,
)
from profile_service import LearnerProfileService


MAX_CSV_BYTES = 1_000_000
MAX_CSV_ROWS = 500


class LearningHistoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.profiles = LearnerProfileService(db)

    def list(self, identity: AuthenticatedUser, limit: int, offset: int) -> LearningHistoryPage:
        self.profiles.ensure_profile(identity)
        query = self.db.query(LearningHistory).filter(LearningHistory.user_id == identity.user_id)
        total = query.count()
        items = query.order_by(LearningHistory.completion_date.desc(), LearningHistory.created_at.desc()).offset(offset).limit(limit).all()
        self.db.commit()
        return LearningHistoryPage(
            items=[LearningHistoryResponse.model_validate(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    def create(
        self,
        identity: AuthenticatedUser,
        course: LearningHistoryCreate,
        source: str = "manual",
        *,
        commit: bool = True,
    ) -> LearningHistory:
        self.profiles.ensure_profile(identity)
        item = LearningHistory(
            id=str(uuid.uuid4()),
            user_id=identity.user_id,
            title=course.title.strip(),
            provider=course.provider.strip() if course.provider else None,
            external_id=course.external_id,
            resource_url=course.resource_url,
            completion_date=datetime.combine(course.completion_date, time.min) if course.completion_date else None,
            topics=[topic.strip() for topic in course.topics if topic.strip()],
            rating=course.rating,
            evidence_url=course.evidence_url,
            source=source,
        )
        self.db.add(item)
        if commit:
            self.db.commit()
            self.db.refresh(item)
        else:
            self.db.flush()
        return item

    def preview_csv(self, identity: AuthenticatedUser, content: bytes) -> CsvPreviewResponse:
        self.profiles.ensure_profile(identity)
        rows = self._parse_csv(identity.user_id, content)
        self.db.commit()
        return CsvPreviewResponse(
            rows=rows,
            ready_count=sum(row.status == "ready" for row in rows),
            invalid_count=sum(row.status == "invalid" for row in rows),
            duplicate_count=sum(row.status == "duplicate" for row in rows),
        )

    def import_csv(
        self, identity: AuthenticatedUser, content: bytes, allow_partial: bool
    ) -> CsvImportResponse:
        self.profiles.ensure_profile(identity)
        rows = self._parse_csv(identity.user_id, content)
        invalid = [row for row in rows if row.status == "invalid"]
        if invalid and not allow_partial:
            raise APIError(
                status_code=422,
                code="CSV_ROWS_INVALID",
                message="Fix invalid CSV rows or enable partial import",
                details={"invalid_rows": [row.row_number for row in invalid]},
            )
        imported = 0
        for row in rows:
            if row.status == "ready" and row.course is not None:
                self.create(identity, row.course, source="csv", commit=False)
                imported += 1
        self.db.commit()
        return CsvImportResponse(
            imported_count=imported,
            rejected_count=len(invalid),
            duplicate_count=sum(row.status == "duplicate" for row in rows),
            rows=rows,
        )

    def _parse_csv(self, user_id: str, content: bytes) -> list[CsvPreviewRow]:
        if len(content) > MAX_CSV_BYTES:
            raise APIError(status_code=413, code="UPLOAD_TOO_LARGE", message="CSV files must be 1 MB or smaller")
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise APIError(status_code=422, code="CSV_ENCODING_INVALID", message="CSV files must use UTF-8 encoding") from exc

        reader = csv.DictReader(StringIO(text))
        required_headers = {"title"}
        if not reader.fieldnames or not required_headers.issubset({name.strip() for name in reader.fieldnames}):
            raise APIError(status_code=422, code="CSV_HEADERS_INVALID", message="CSV must include a title header")

        existing_keys = {
            self._course_key(item.title, item.provider)
            for item in self.db.query(LearningHistory).filter(LearningHistory.user_id == user_id)
        }
        seen = set(existing_keys)
        preview: list[CsvPreviewRow] = []
        for index, raw in enumerate(reader, start=2):
            if index - 1 > MAX_CSV_ROWS:
                raise APIError(status_code=413, code="CSV_TOO_MANY_ROWS", message="CSV files may contain at most 500 data rows")
            course, errors = self._parse_row(raw)
            status = "invalid" if errors else "ready"
            if course is not None and not errors:
                key = self._course_key(course.title, course.provider)
                if key in seen:
                    status = "duplicate"
                seen.add(key)
            preview.append(CsvPreviewRow(row_number=index, status=status, course=course, errors=errors))
        return preview

    @staticmethod
    def _parse_row(raw: dict[str, str | None]) -> tuple[LearningHistoryCreate | None, list[str]]:
        errors: list[str] = []
        title = (raw.get("title") or "").strip()
        if not title:
            errors.append("title is required")

        completion_date: date | None = None
        date_value = (raw.get("completion_date") or "").strip()
        if date_value:
            try:
                completion_date = date.fromisoformat(date_value)
            except ValueError:
                errors.append("completion_date must use YYYY-MM-DD")

        rating: int | None = None
        rating_value = (raw.get("rating") or "").strip()
        if rating_value:
            try:
                rating = int(rating_value)
                if not 1 <= rating <= 5:
                    errors.append("rating must be between 1 and 5")
            except ValueError:
                errors.append("rating must be a whole number")

        data = {
            "title": title or "invalid",
            "provider": (raw.get("provider") or "").strip() or None,
            "completion_date": completion_date,
            "topics": [part.strip() for part in (raw.get("topics") or "").replace(";", "|").split("|") if part.strip()],
            "rating": rating if rating is None or 1 <= rating <= 5 else None,
            "evidence_url": (raw.get("evidence_url") or "").strip() or None,
            "resource_url": (raw.get("resource_url") or "").strip() or None,
            "external_id": (raw.get("external_id") or "").strip() or None,
        }
        try:
            return LearningHistoryCreate.model_validate(data), errors
        except ValidationError as exc:
            errors.extend(error["msg"] for error in exc.errors())
            return None, errors

    @staticmethod
    def _course_key(title: str, provider: str | None) -> tuple[str, str]:
        return (" ".join(title.casefold().split()), " ".join((provider or "").casefold().split()))
