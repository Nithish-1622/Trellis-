from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import AssessmentAttempt, Base, SkillEvidence, get_db
from main import app


@pytest.fixture
def assessment_client() -> Iterator[tuple[TestClient, Session, dict]]:
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
    assert client.post("/v1/me/onboarding", json=onboarding).status_code == 200
    roadmap = client.post("/v1/roadmaps", json={}).json()
    context = {"roadmap": roadmap, "milestone_id": roadmap["milestones"][0]["id"]}
    try:
        yield client, db, context
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_quiz_is_deterministic_and_attempt_creates_objective_evidence(assessment_client):
    client, db, context = assessment_client
    quiz = client.get(f"/v1/assessments/milestones/{context['milestone_id']}/quiz")

    assert quiz.status_code == 200
    assert len(quiz.json()["questions"]) >= 3
    assert "correct_answer" not in quiz.json()["questions"][0]
    answers = [{"question_id": item["id"], "answer": item["options"][0]} for item in quiz.json()["questions"]]
    attempt = client.post(f"/v1/assessments/milestones/{context['milestone_id']}/quiz-attempts", json={"answers": answers})

    assert attempt.status_code == 201
    assert attempt.json()["assessment_type"] == "quiz"
    assert attempt.json()["provisional"] is False
    assert 0 <= attempt.json()["score"] <= 1
    assert db.query(AssessmentAttempt).count() == 1
    evidence = db.query(SkillEvidence).one()
    assert evidence.source_type == "quiz"
    assert evidence.weight == 1.0


def test_quizzes_are_specific_to_each_milestone(assessment_client):
    client, _db, context = assessment_client
    first, second = context["roadmap"]["milestones"][:2]

    first_quiz = client.get(f"/v1/assessments/milestones/{first['id']}/quiz").json()
    second_quiz = client.get(f"/v1/assessments/milestones/{second['id']}/quiz").json()

    first_prompts = " ".join(item["prompt"] for item in first_quiz["questions"]).casefold()
    second_prompts = " ".join(item["prompt"] for item in second_quiz["questions"]).casefold()
    assert first_quiz["questions"] != second_quiz["questions"]
    assert first["target_skills"][0].casefold() in first_prompts
    assert second["target_skills"][0].casefold() in second_prompts


def test_project_review_is_explicitly_provisional_and_weighted_lower(assessment_client):
    client, db, context = assessment_client

    response = client.post(
        f"/v1/assessments/milestones/{context['milestone_id']}/project-submissions",
        json={"repository_url": "https://github.com/example/api-project", "summary": "A tested API with documentation, automated checks, and deployment instructions.", "reflection": "I learned how to structure service boundaries."},
    )

    assert response.status_code == 201
    assert response.json()["assessment_type"] == "project"
    assert response.json()["provisional"] is True
    assert response.json()["rubric"]
    evidence = db.query(SkillEvidence).one()
    assert evidence.source_type == "project_review"
    assert evidence.weight < 1.0


def test_assessments_cannot_target_another_learners_milestone(assessment_client):
    client, _db, context = assessment_client
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(user_id="learner-two", email="two@example.com", name="Two", roles=["learner"])

    response = client.get(f"/v1/assessments/milestones/{context['milestone_id']}/quiz")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "MILESTONE_NOT_FOUND"
