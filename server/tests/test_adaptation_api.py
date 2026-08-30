from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import AdaptationProposal, Base, RoadmapVersion, get_db
from main import app


@pytest.fixture
def adaptation_client() -> Iterator[tuple[TestClient, Session, dict]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    identity = AuthenticatedUser(user_id="learner-one", email="one@example.com", name="One", roles=["learner"])

    def override_db() -> Iterator[Session]:
        yield db

    async def override_user() -> AuthenticatedUser:
        return identity

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    client = TestClient(app)
    onboarding = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": [], "skills": []}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    client.post("/v1/me/onboarding", json=onboarding)
    roadmap = client.post("/v1/roadmaps", json={}).json()
    context = {"roadmap": roadmap, "milestone_id": roadmap["milestones"][0]["id"]}
    try:
        yield client, db, context
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def submit_quiz(client: TestClient, milestone_id: str, correct: bool) -> None:
    quiz = client.get(f"/v1/assessments/milestones/{milestone_id}/quiz").json()
    answers = [{"question_id": item["id"], "answer": item["options"][0 if correct else -1]} for item in quiz["questions"]]
    assert client.post(f"/v1/assessments/milestones/{milestone_id}/quiz-attempts", json={"answers": answers}).status_code == 201


def test_weak_evidence_proposes_remediation_and_accepts_atomically(adaptation_client):
    client, db, context = adaptation_client
    submit_quiz(client, context["milestone_id"], correct=False)

    proposal = client.post(f"/v1/roadmaps/{context['roadmap']['id']}/adaptations", json={})

    assert proposal.status_code == 201
    assert proposal.json()["status"] == "pending"
    assert proposal.json()["diff"]["additions"][0]["reason"] == "remediation"
    assert client.get("/v1/roadmaps/current").json()["version_number"] == 1

    accepted = client.post(f"/v1/adaptations/{proposal.json()['id']}/accept")
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"
    current = client.get("/v1/roadmaps/current").json()
    assert current["version_number"] == 2
    assert any(item["stable_key"].startswith("remediation-") for item in current["milestones"])
    assert db.query(RoadmapVersion).filter(RoadmapVersion.status == "active").count() == 1


def test_strong_evidence_proposes_acceleration_and_rejection_keeps_active_version(adaptation_client):
    client, db, context = adaptation_client
    submit_quiz(client, context["milestone_id"], correct=True)

    proposal = client.post(f"/v1/roadmaps/{context['roadmap']['id']}/adaptations", json={}).json()

    assert proposal["diff"]["removals"]
    rejected = client.post(f"/v1/adaptations/{proposal['id']}/reject", json={"feedback": "I want the extra practice."})
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert client.get("/v1/roadmaps/current").json()["version_number"] == 1
    stored = db.get(AdaptationProposal, proposal["id"])
    assert stored.feedback == "I want the extra practice."
