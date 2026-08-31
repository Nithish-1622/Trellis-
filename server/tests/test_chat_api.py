from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, Memory, RoadmapVersion, get_db
from main import app


@pytest.fixture
def chat_client() -> Iterator[tuple[TestClient, Session, dict]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    identity = {"user": AuthenticatedUser(user_id="learner-one", email="one@example.com", name="One", roles=["learner"])}

    def override_db() -> Iterator[Session]:
        yield db

    async def override_user() -> AuthenticatedUser:
        return identity["user"]

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    client = TestClient(app)
    onboarding = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": [], "skills": []}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    client.post("/v1/me/onboarding", json=onboarding)
    context = {"roadmap": client.post("/v1/roadmaps", json={}).json()}
    try:
        yield client, db, context
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_chat_explains_recommendations_from_persisted_roadmap_context(chat_client):
    client, db, context = chat_client

    response = client.post("/v1/chat/messages", json={"message": "Why is this my next milestone?"})

    assert response.status_code == 200
    assert context["roadmap"]["milestones"][0]["title"] in response.json()["message"]
    assert response.json()["context"]["roadmap_id"] == context["roadmap"]["id"]
    assert db.query(Memory).count() == 2


def test_chat_turns_requested_changes_into_typed_actions_without_mutating(chat_client):
    client, db, _context = chat_client
    version_count = db.query(RoadmapVersion).count()

    response = client.post("/v1/chat/messages", json={"message": "Remove the Python milestone and change my roadmap."})

    assert response.status_code == 200
    assert response.json()["actions"][0]["action_type"] == "request_adaptation"
    assert response.json()["actions"][0]["requires_confirmation"] is True
    assert db.query(RoadmapVersion).count() == version_count


def test_chat_history_is_scoped_to_authenticated_identity(chat_client):
    client, db, _context = chat_client
    client.post("/v1/chat/messages", json={"message": "What should I do next?"})

    assert db.query(Memory).filter(Memory.user_id == "learner-one").count() == 2
    assert db.query(Memory).filter(Memory.user_id == "learner-two").count() == 0
