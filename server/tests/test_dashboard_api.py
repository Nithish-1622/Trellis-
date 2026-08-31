from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, get_db
from main import app


@pytest.fixture
def dashboard_client() -> Iterator[tuple[TestClient, Session]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()

    def override_db() -> Iterator[Session]:
        yield db

    async def override_user() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="learner-one", email="one@example.com", name="One", roles=["learner"])

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        yield TestClient(app), db
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def onboard(client: TestClient) -> None:
    payload = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": ["APIs"], "skills": [{"name": "Python", "proficiency": "beginner", "evidence_source": "self_reported"}]}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    assert client.post("/v1/me/onboarding", json=payload).status_code == 200


def test_dashboard_guides_new_learner_to_onboarding(dashboard_client):
    client, _db = dashboard_client

    response = client.get("/v1/me/dashboard")

    assert response.status_code == 200
    assert response.json()["roadmap"] is None
    assert response.json()["next_action"]["action_type"] == "complete_onboarding"


def test_dashboard_summarizes_progress_evidence_and_next_action(dashboard_client):
    client, _db = dashboard_client
    onboard(client)
    roadmap = client.post("/v1/roadmaps", json={}).json()
    first = roadmap["milestones"][0]
    assert client.patch(f"/v1/roadmaps/{roadmap['id']}/milestones/{first['id']}", json={"progress_percentage": 50, "time_spent_minutes": 40, "resource_url": "https://learn.example.test/python", "resource_title": "Python practice"}).status_code == 200
    quiz = client.get(f"/v1/assessments/milestones/{first['id']}/quiz").json()
    answers = [{"question_id": item["id"], "answer": item["options"][0]} for item in quiz["questions"]]
    client.post(f"/v1/assessments/milestones/{first['id']}/quiz-attempts", json={"answers": answers})

    dashboard = client.get("/v1/me/dashboard").json()
    skills = client.get("/v1/me/skills").json()

    assert dashboard["roadmap"]["progress_percentage"] > 0
    assert dashboard["weekly_effort_minutes"] == 40
    assert dashboard["recent_assessments"][0]["score"] == 1
    assert dashboard["next_action"]["milestone_id"] == first["id"]
    assert skills["items"][0]["evidence_count"] >= 1
    assert 0 <= skills["items"][0]["estimated_score"] <= 1
