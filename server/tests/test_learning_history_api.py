from collections.abc import Iterator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, LearningHistory, get_db
from main import app


@pytest.fixture
def history_client() -> Iterator[tuple[TestClient, Session, dict[str, AuthenticatedUser]]]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine)
    db = testing_session()
    identity = {
        "user": AuthenticatedUser(
            user_id="learner-one",
            email="one@example.com",
            name="Learner One",
            roles=["learner"],
        )
    }

    def override_db() -> Iterator[Session]:
        yield db

    async def override_user() -> AuthenticatedUser:
        return identity["user"]

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        yield TestClient(app), db, identity
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_learning_history_is_created_and_scoped_to_authenticated_user(history_client):
    client, _db, identity = history_client
    created = client.post(
        "/v1/me/learning-history",
        json={
            "title": "Reliable Python Services",
            "provider": "Trellis Academy",
            "completion_date": "2026-06-01",
            "topics": ["Python", "APIs"],
            "rating": 5,
        },
    )

    assert created.status_code == 201
    assert created.json()["source"] == "manual"
    assert len(client.get("/v1/me/learning-history").json()["items"]) == 1

    identity["user"] = AuthenticatedUser(
        user_id="learner-two",
        email="two@example.com",
        name="Learner Two",
        roles=["learner"],
    )
    assert client.get("/v1/me/learning-history").json()["items"] == []


def test_csv_preview_reports_row_errors_and_duplicates(history_client):
    client, _db, _identity = history_client
    csv_data = (
        "title,provider,completion_date,topics,rating\n"
        "FastAPI Foundations,Example,2026-02-10,Python|APIs,4\n"
        ",Example,not-a-date,Python,9\n"
        "FastAPI Foundations,Example,2026-02-10,Python,4\n"
    )

    response = client.post(
        "/v1/me/learning-history/csv/preview",
        files={"file": ("history.csv", BytesIO(csv_data.encode()), "text/csv")},
    )

    assert response.status_code == 200
    rows = response.json()["rows"]
    assert rows[0]["status"] == "ready"
    assert rows[1]["status"] == "invalid"
    assert "title is required" in rows[1]["errors"]
    assert rows[2]["status"] == "duplicate"


def test_csv_partial_import_persists_only_valid_unique_rows(history_client):
    client, db, _identity = history_client
    csv_data = (
        "title,provider,completion_date,topics,rating\n"
        "FastAPI Foundations,Example,2026-02-10,Python|APIs,4\n"
        ",Example,not-a-date,Python,9\n"
    )

    response = client.post(
        "/v1/me/learning-history/csv/import?allow_partial=true",
        files={"file": ("history.csv", BytesIO(csv_data.encode()), "text/csv")},
    )

    assert response.status_code == 200
    assert response.json()["imported_count"] == 1
    assert response.json()["rejected_count"] == 1
    assert db.query(LearningHistory).count() == 1

