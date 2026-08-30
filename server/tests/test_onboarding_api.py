from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, LearnerSkill, get_db
from main import app


@pytest.fixture
def onboarding_client() -> Iterator[tuple[TestClient, Session, dict[str, AuthenticatedUser]]]:
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


def onboarding_payload(*, complete: bool = False) -> dict:
    return {
        "current_step": "review",
        "completed_steps": ["goal", "current_position", "previous_learning", "preferences"],
        "complete": complete,
        "draft": {
            "goal": {
                "free_text": "I want to become a backend engineer within a year.",
                "target_role": "Backend Engineer",
                "objective": "Build production-ready distributed services",
                "target_date": "2027-08-30",
            },
            "current_position": {
                "current_role": "Junior Developer",
                "experience_years": 1.5,
                "education_level": "Bachelor's",
                "interests": ["distributed systems", "developer tools"],
                "skills": [
                    {
                        "name": "Python",
                        "proficiency": "intermediate",
                        "evidence_source": "self_reported",
                    }
                ],
            },
            "previous_learning": {"courses": []},
            "preferences": {
                "preferred_formats": ["project", "course"],
                "project_theory_balance": 70,
                "learning_pace": "steady",
                "weekly_hours": 8,
                "preferred_language": "English",
                "budget": "free_or_paid",
                "accessibility_needs": [],
                "preferred_session_minutes": 45,
            },
        },
    }


def test_interrupted_onboarding_resumes_from_server_draft(onboarding_client):
    client, _db, _identity = onboarding_client
    payload = onboarding_payload()
    payload["current_step"] = "current_position"
    payload["completed_steps"] = ["goal"]

    saved = client.post("/v1/me/onboarding", json=payload)
    resumed = client.get("/v1/me/onboarding")

    assert saved.status_code == 200
    assert resumed.status_code == 200
    assert resumed.json()["current_step"] == "current_position"
    assert resumed.json()["completed_steps"] == ["goal"]
    assert resumed.json()["draft"]["goal"]["target_role"] == "Backend Engineer"


def test_onboarding_drafts_are_scoped_to_authenticated_identity(onboarding_client):
    client, _db, identity = onboarding_client
    assert client.post("/v1/me/onboarding", json=onboarding_payload()).status_code == 200

    identity["user"] = AuthenticatedUser(
        user_id="learner-two",
        email="two@example.com",
        name="Learner Two",
        roles=["learner"],
    )
    response = client.get("/v1/me/onboarding")

    assert response.status_code == 200
    assert response.json()["status"] == "not_started"
    assert response.json()["draft"]["goal"] is None


def test_onboarding_completion_is_idempotent_and_persists_normalized_profile(onboarding_client):
    client, db, _identity = onboarding_client
    payload = onboarding_payload(complete=True)

    first = client.post("/v1/me/onboarding", json=payload)
    second = client.post("/v1/me/onboarding", json=payload)
    profile = client.get("/v1/me/profile")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["status"] == "completed"
    assert second.json()["session_id"] == first.json()["session_id"]
    assert profile.status_code == 200
    assert profile.json()["target_role"] == "Backend Engineer"
    assert profile.json()["weekly_hours"] == 8
    assert profile.json()["is_onboarding_complete"] is True
    assert db.query(LearnerSkill).count() == 1


def test_onboarding_rejects_invalid_availability_with_error_envelope(onboarding_client):
    client, _db, _identity = onboarding_client
    payload = onboarding_payload()
    payload["draft"]["preferences"]["weekly_hours"] = 200

    response = client.post("/v1/me/onboarding", json=payload)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
