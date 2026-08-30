from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, LearningResource, RoadmapMilestone, RoadmapResourceAssignment, get_db
from main import app
from roadmap_engine import canonical_skill_name


@pytest.fixture
def roadmap_client() -> Iterator[tuple[TestClient, Session, dict[str, AuthenticatedUser]]]:
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    db = session_factory()
    identity = {"user": AuthenticatedUser(user_id="learner-one", email="one@example.com", name="One", roles=["learner"])}

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


def complete_onboarding(client: TestClient, completed_python: bool = False) -> None:
    courses = [{"title": "Python Foundations", "provider": "Example", "topics": ["Python"]}] if completed_python else []
    payload = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer within one year", "target_role": "Backend Engineer", "objective": "Build and deploy reliable APIs", "target_date": "2027-08-30"}, "current_position": {"current_role": "Junior Developer", "interests": ["APIs"], "skills": []}, "previous_learning": {"courses": courses}, "preferences": {"preferred_formats": ["course", "project"], "weekly_hours": 5, "preferred_language": "English", "accessibility_needs": []}}}
    assert client.post("/v1/me/onboarding", json=payload).status_code == 200


def seed_resource(db: Session) -> str:
    resource = LearningResource(id="resource-api", provider="Example", external_id="api-101", resource_type="course", title="API Engineering", description="Build reliable APIs", level="intermediate", duration_minutes=240, topics=["APIs", "Testing"], prerequisites=["Python"], cost_type="free", language="English", url="https://learn.example.test/api", verification_status="verified", link_status="healthy", resource_metadata={})
    db.add(resource)
    db.commit()
    return resource.url


def test_skill_aliases_resolve_to_a_canonical_name():
    assert canonical_skill_name("  REST APIs ") == "api design"
    assert canonical_skill_name("PostgreSQL") == "databases"


def test_generated_roadmap_is_prerequisite_aware_scheduled_and_explained(roadmap_client):
    client, db, _identity = roadmap_client
    complete_onboarding(client)
    expected_url = seed_resource(db)

    response = client.post("/v1/roadmaps", json={})

    assert response.status_code == 201
    roadmap = response.json()
    assert roadmap["version_number"] == 1
    assert len(roadmap["milestones"]) >= 3
    sequences = [item["sequence"] for item in roadmap["milestones"]]
    assert sequences == sorted(sequences)
    assert all(item["deadline"] for item in roadmap["milestones"])
    assert all(item["explanation"]["why"] for item in roadmap["milestones"])
    urls = [resource["url"] for item in roadmap["milestones"] for resource in item["recommended_resources"]]
    assert expected_url in urls


def test_vetted_resources_enter_new_roadmaps_without_admin_review_and_are_assigned(roadmap_client):
    client, db, _identity = roadmap_client
    complete_onboarding(client)
    db.add_all([
        LearningResource(id="vetted-api", provider="youtube", external_id="vetted-api", canonical_key="youtube:vetted-api", resource_type="video", title="API design tutorial", url="https://youtube.com/watch?v=vetted-api", topics=["API design"], language="English", verification_status="vetted", resource_score=91, score_confidence=.8, score_version="trellis-resource-score/v1", link_status="healthy", author="Teacher"),
        LearningResource(id="discovered-api", provider="youtube", external_id="discovered-api", canonical_key="youtube:discovered-api", resource_type="video", title="API design draft", url="https://youtube.com/watch?v=discovered-api", topics=["API design"], language="English", verification_status="discovered", resource_score=99, score_confidence=.9, link_status="healthy"),
    ])
    db.commit()

    response = client.post("/v1/roadmaps", json={})

    assert response.status_code == 201
    resources = [resource for milestone in response.json()["milestones"] for resource in milestone["recommended_resources"]]
    assert any(resource["id"] == "vetted-api" and resource["status"] == "vetted" for resource in resources)
    assert all(resource["id"] != "discovered-api" for resource in resources)
    assert db.query(RoadmapResourceAssignment).filter_by(resource_id="vetted-api").count() == 1


def test_completed_learning_prevents_redundant_foundation_milestone(roadmap_client):
    client, _db, _identity = roadmap_client
    complete_onboarding(client, completed_python=True)

    response = client.post("/v1/roadmaps", json={})

    assert response.status_code == 201
    skills = [skill for item in response.json()["milestones"] for skill in item["target_skills"]]
    assert "python" not in skills


def test_roadmap_and_milestone_updates_are_owned_by_authenticated_user(roadmap_client):
    client, db, identity = roadmap_client
    complete_onboarding(client)
    created = client.post("/v1/roadmaps", json={}).json()
    milestone_id = created["milestones"][0]["id"]

    progress = client.patch(f"/v1/roadmaps/{created['id']}/milestones/{milestone_id}", json={"progress_percentage": 40, "time_spent_minutes": 55})
    assert progress.status_code == 200
    assert progress.json()["progress_percentage"] == 40
    assert db.get(RoadmapMilestone, milestone_id).status == "in_progress"

    identity["user"] = AuthenticatedUser(user_id="learner-two", email="two@example.com", name="Two", roles=["learner"])
    assert client.get(f"/v1/roadmaps/{created['id']}").status_code == 404
