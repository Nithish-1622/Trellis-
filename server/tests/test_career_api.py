from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from career_api import get_job_provider
from database import Base, InterviewEvidenceSession, SkillEvidence, get_db
from main import app


class FakeJobProvider:
    async def search(self, role: str, limit: int) -> list[dict]:
        return [{
            "id": "verified-job-1", "title": role, "company": "Example Co",
            "location": "Remote", "job_type": "Full-time", "required_skills": ["Python"],
            "salary_range": None, "description": "Build reliable services.",
            "url": "https://jobs.example.com/verified-job-1", "posted_date": None,
            "source": "test-provider",
        }][:limit]


@pytest.fixture
def career_client() -> Iterator[tuple[TestClient, Session]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()

    def override_db() -> Iterator[Session]:
        yield db

    async def override_user() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="learner-one", email="one@example.com", name="One", roles=["learner"])

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_job_provider] = lambda: FakeJobProvider()
    client = TestClient(app)
    onboarding = {
        "current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True,
        "draft": {
            "goal": {"free_text": "Become a backend engineer", "target_role": "Backend Engineer", "objective": "Build APIs"},
            "current_position": {"interests": [], "skills": [{"name": "Python", "proficiency": "beginner", "evidence_source": "self_report"}]},
            "previous_learning": {"courses": []},
            "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []},
        },
    }
    assert client.post("/v1/me/onboarding", json=onboarding).status_code == 200
    try:
        yield client, db
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_jobs_use_authenticated_profile_and_provider_urls(career_client):
    client, _db = career_client
    response = client.get("/v1/career/jobs?limit=5")

    assert response.status_code == 200
    assert response.json()["items"][0]["title"] == "Backend Engineer"
    assert response.json()["items"][0]["url"] == "https://jobs.example.com/verified-job-1"
    assert "user_id" not in response.json()["items"][0]


def test_interview_is_persistent_and_creates_lower_weight_evidence(career_client):
    client, db = career_client
    started = client.post("/v1/career/interviews", json={"target_role": "Backend Engineer", "focus_area": "Python"})
    assert started.status_code == 201
    session_id = started.json()["session_id"]

    for answer in [
        "I would define the API contract and validate all input with tests.",
        "I would use transactions, indexes, monitoring, and bounded retries.",
        "I would profile the service, explain tradeoffs, and verify the fix.",
    ]:
        submitted = client.post(f"/v1/career/interviews/{session_id}/answers", json={"answer": answer})
        assert submitted.status_code == 200

    report = client.get(f"/v1/career/interviews/{session_id}")
    assert report.status_code == 200
    assert report.json()["status"] == "completed"
    assert db.query(InterviewEvidenceSession).one().status == "completed"
    evidence = db.query(SkillEvidence).filter(SkillEvidence.source_type == "interview").one()
    assert evidence.weight < 0.7


def test_interview_accepts_a_concise_non_empty_answer(career_client):
    client, _db = career_client
    started = client.post("/v1/career/interviews", json={"target_role": "Backend Engineer", "focus_area": "Caching"})

    response = client.post(
        f'/v1/career/interviews/{started.json()["session_id"]}/answers',
        json={"answer": "Use Redis."},
    )

    assert response.status_code == 200
    assert response.json()["previous_score"] is not None

    blank = client.post(
        f'/v1/career/interviews/{started.json()["session_id"]}/answers',
        json={"answer": "   "},
    )
    assert blank.status_code == 422


def test_interview_and_application_feedback_are_owner_scoped(career_client):
    client, db = career_client
    started = client.post("/v1/career/interviews", json={"target_role": "Backend Engineer", "focus_area": "Python"})
    session_id = started.json()["session_id"]
    application = client.post("/v1/career/applications", json={
        "company": "Example Co", "position": "Backend Engineer", "status": "interviewed",
        "feedback": "Review database indexing", "interview_topics": ["Databases"],
    })
    assert application.status_code == 201
    evidence = db.query(SkillEvidence).filter(SkillEvidence.source_type == "application_feedback").one()
    assert evidence.weight < 0.5

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(user_id="learner-two", email="two@example.com", name="Two", roles=["learner"])
    denied = client.get(f"/v1/career/interviews/{session_id}")
    assert denied.status_code == 404
