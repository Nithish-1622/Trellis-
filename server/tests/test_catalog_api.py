from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, LearningResource, get_db
from main import app


@pytest.fixture
def catalog_client() -> Iterator[tuple[TestClient, Session, dict[str, AuthenticatedUser]]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    db = session_factory()
    identity = {"user": AuthenticatedUser(user_id="admin-user", email="admin@example.com", name="Admin", roles=["learner", "admin"])}

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


def resource_payload() -> dict:
    return {
        "provider": "Trellis Academy",
        "external_id": "python-api-101",
        "resource_type": "course",
        "title": "Build Reliable Python APIs",
        "description": "Testing, observability, and API design.",
        "level": "intermediate",
        "duration_minutes": 360,
        "topics": ["Python", "APIs", "Testing"],
        "prerequisites": ["Python fundamentals"],
        "cost_type": "free",
        "language": "English",
        "url": "https://academy.example.test/python-api-101",
        "verification_status": "verified",
    }


def test_non_admin_cannot_manage_catalog(catalog_client):
    client, _db, identity = catalog_client
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])

    response = client.post("/v1/admin/resources", json=resource_payload())

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ADMIN_REQUIRED"


def test_admin_can_create_verify_and_archive_resource(catalog_client):
    client, db, _identity = catalog_client
    created = client.post("/v1/admin/resources", json=resource_payload())

    assert created.status_code == 201
    resource_id = created.json()["id"]
    assert created.json()["verified_by"] == "admin-user"
    assert client.patch(f"/v1/admin/resources/{resource_id}", json={"title": "Reliable Python API Engineering"}).status_code == 200
    archived = client.delete(f"/v1/admin/resources/{resource_id}")
    assert archived.status_code == 200
    assert archived.json()["archived_at"] is not None
    assert db.query(LearningResource).count() == 1


def test_recommendations_only_return_verified_real_catalog_urls(catalog_client):
    client, _db, identity = catalog_client
    assert client.post("/v1/admin/resources", json=resource_payload()).status_code == 201
    unverified = {**resource_payload(), "external_id": "draft", "title": "Draft resource", "url": "https://academy.example.test/draft", "verification_status": "pending"}
    assert client.post("/v1/admin/resources", json=unverified).status_code == 201
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    onboarding = {
        "current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True,
        "draft": {
            "goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build Python APIs"},
            "current_position": {"interests": ["APIs"], "skills": [{"name": "Python", "proficiency": "beginner", "evidence_source": "self_reported"}]},
            "previous_learning": {"courses": []},
            "preferences": {"preferred_formats": ["course"], "weekly_hours": 8, "preferred_language": "English", "accessibility_needs": []},
        },
    }
    assert client.post("/v1/me/onboarding", json=onboarding).status_code == 200

    response = client.get("/v1/resources/recommendations")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    recommendation = response.json()["items"][0]
    assert recommendation["url"] == resource_payload()["url"]
    assert recommendation["explanation"]
    assert recommendation["provenance"] == "verified_catalog"


def test_catalog_rejects_non_http_resource_urls(catalog_client):
    client, _db, _identity = catalog_client
    payload = {**resource_payload(), "url": "javascript:alert(1)"}

    response = client.post("/v1/admin/resources", json=payload)

    assert response.status_code == 422
