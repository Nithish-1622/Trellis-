from collections.abc import Iterator
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser, get_current_user
from database import Base, LearningResource, ResourceEvaluation, ResourceInteraction, ResourceJob, ResourceModerationAction, ResourceSignalSummary, get_db
from catalog_api import get_link_checker
from main import app
from resource_providers import ExternalResource, get_hybrid_resource_provider


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
        "moderation_reason": "Reviewed against the pilot catalog criteria.",
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
    unverified = {**resource_payload(), "external_id": "draft", "title": "Draft resource", "url": "https://academy.example.test/draft", "verification_status": "discovered"}
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

    response = client.get("/v1/resources/recommendations?include_live=false")

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


def test_missing_catalog_resource_uses_structured_error(catalog_client):
    client, _db, _identity = catalog_client

    response = client.delete("/v1/admin/resources/missing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_recommendations_use_only_indexed_verified_and_vetted_resources(catalog_client):
    client, db, identity = catalog_client
    assert client.post("/v1/admin/resources", json=resource_payload()).status_code == 201
    db.add_all([
        LearningResource(id="vetted", provider="youtube", external_id="video-1", canonical_key="youtube:video-1", resource_type="video", title="Backend API design", description="A current walkthrough", url="https://www.youtube.com/watch?v=video-1", topics=["APIs"], language="English", verification_status="vetted", resource_score=91, score_confidence=.82, score_version="trellis-resource-score/v1", link_status="healthy", resource_metadata={}, author="Teacher"),
        LearningResource(id="discovered", provider="youtube", external_id="video-2", canonical_key="youtube:video-2", resource_type="video", title="Hidden API draft", url="https://www.youtube.com/watch?v=video-2", topics=["APIs"], language="English", verification_status="discovered", resource_score=79, score_confidence=.8, link_status="healthy", resource_metadata={}),
    ])
    db.commit()
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])

    class StubProvider:
        async def search(self, _query, _limit):
            raise AssertionError("Recommendations must not call external providers")

    app.dependency_overrides[get_hybrid_resource_provider] = lambda: StubProvider()
    profile = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": [], "skills": []}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    assert client.post("/v1/me/onboarding", json=profile).status_code == 200

    response = client.get("/v1/resources/recommendations?include_live=true")

    assert response.status_code == 200
    items = response.json()["items"]
    assert {item["verification_status"] for item in items} == {"verified", "vetted"}
    vetted = next(item for item in items if item["verification_status"] == "vetted")
    assert vetted["score"] == 91
    assert vetted["confidence"] == .82
    assert vetted["why_recommended"]
    assert all(item["id"] != "discovered" for item in items)


def test_admin_can_bulk_import_and_preview_but_manual_provider_sync_is_removed(catalog_client):
    client, _db, _identity = catalog_client
    second = {**resource_payload(), "external_id": "python-api-201", "title": "Advanced API Reliability", "url": "https://academy.example.test/python-api-201"}

    bulk = client.post("/v1/admin/resources/bulk", json={"resources": [resource_payload(), second]})
    assert bulk.status_code == 201
    assert bulk.json()["created"] == 2

    class StubProvider:
        async def search(self, query: str, limit: int):
            return [ExternalResource(provider="github", external_id="123", resource_type="project", title="example/backend-project", url="https://github.com/example/backend-project", topics=["APIs"])]

    app.dependency_overrides[get_hybrid_resource_provider] = lambda: StubProvider()
    preview = client.get("/v1/admin/resources/provider-preview?query=backend%20APIs&limit=5")
    assert preview.status_code == 200
    assert preview.json()[0]["canonical_key"] == "github:example/backend-project"
    assert client.post("/v1/admin/resources/provider-sync", json={"query": "backend APIs", "limit": 5}).status_code == 405


def test_discovery_job_is_idempotent_owned_and_does_not_repeat_provider_calls(catalog_client):
    client, db, identity = catalog_client
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    profile = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": [], "skills": []}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    assert client.post("/v1/me/onboarding", json=profile).status_code == 200

    first = client.post("/v1/resources/discover")
    second = client.post("/v1/resources/discover")

    assert first.status_code == 202
    assert second.status_code == 202
    assert first.json()["id"] == second.json()["id"]
    assert db.query(ResourceJob).count() == 1
    assert client.get(f"/v1/resources/discovery-jobs/{first.json()['id']}").status_code == 200
    identity["user"] = AuthenticatedUser(user_id="other", email="other@example.com", name="Other", roles=["learner"])
    assert client.get(f"/v1/resources/discovery-jobs/{first.json()['id']}").status_code == 404


def test_admin_link_check_persists_status_without_exposing_provider_error(catalog_client):
    client, db, _identity = catalog_client
    resource_id = client.post("/v1/admin/resources", json=resource_payload()).json()["id"]

    class StubChecker:
        async def check(self, url: str) -> str:
            assert url.startswith("https://")
            return "healthy"

    app.dependency_overrides[get_link_checker] = lambda: StubChecker()
    response = client.post(f"/v1/admin/resources/{resource_id}/check-link")

    assert response.status_code == 200
    assert response.json()["link_status"] == "healthy"
    assert db.get(LearningResource, resource_id).link_status == "healthy"


def test_learner_feedback_is_idempotent_aggregated_and_reports_enqueue_reevaluation(catalog_client):
    client, db, identity = catalog_client
    resource_id = client.post("/v1/admin/resources", json=resource_payload()).json()["id"]
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    onboarding = {"current_step": "review", "completed_steps": ["goal", "current_position", "previous_learning", "preferences"], "complete": True, "draft": {"goal": {"free_text": "Become a backend engineer this year", "target_role": "Backend Engineer", "objective": "Build APIs"}, "current_position": {"interests": [], "skills": []}, "previous_learning": {"courses": []}, "preferences": {"preferred_formats": [], "weekly_hours": 8, "accessibility_needs": []}}}
    assert client.post("/v1/me/onboarding", json=onboarding).status_code == 200

    helpful = {"event_type": "helpful", "idempotency_key": "feedback-helpful-1"}
    assert client.post(f"/v1/resources/{resource_id}/interactions", json=helpful).status_code == 201
    duplicate = client.post(f"/v1/resources/{resource_id}/interactions", json=helpful)
    report = client.post(f"/v1/resources/{resource_id}/interactions", json={"event_type": "report", "idempotency_key": "feedback-report-1", "report_reason": "The material appears outdated."})

    assert duplicate.status_code == 200
    assert duplicate.json()["created"] is False
    assert report.status_code == 201
    assert db.query(ResourceInteraction).count() == 2
    summary = db.get(ResourceSignalSummary, resource_id)
    assert summary.helpful == 1
    assert summary.reports == 1
    assert db.query(ResourceJob).filter_by(job_type="evaluation").count() == 1
    identity["user"] = AuthenticatedUser(user_id="admin-user", email="admin@example.com", name="Admin", roles=["learner", "admin"])
    exceptions = client.get("/v1/admin/resources?exception_category=reports")
    assert exceptions.status_code == 200
    assert [item["id"] for item in exceptions.json()["items"]] == [resource_id]


def test_admin_moderation_requires_reason_and_preserves_algorithmic_score(catalog_client):
    client, db, identity = catalog_client
    resource_id = client.post("/v1/admin/resources", json=resource_payload()).json()["id"]
    resource = db.get(LearningResource, resource_id)
    resource.resource_score = 86
    resource.score_confidence = .7
    resource.score_version = "trellis-resource-score/v1"
    db.add(ResourceEvaluation(id="eval-1", resource_id=resource_id, evaluation_version="trellis-resource-score/v1", relevance_score=90, content_quality_score=85, engagement_score=80, creator_score=75, freshness_score=95, final_score=86, confidence=.7, input_fingerprint="fp", evidence={}, evaluated_at=datetime.utcnow()))
    db.commit()

    assert client.post(f"/v1/admin/resources/{resource_id}/moderate", json={"action": "score_override", "score": 92}).status_code == 422
    moderated = client.post(f"/v1/admin/resources/{resource_id}/moderate", json={"action": "score_override", "score": 92, "reason": "Exceptional fit confirmed during curriculum review."})

    assert moderated.status_code == 200
    db.refresh(resource)
    assert resource.resource_score == 86
    assert resource.score_override == 92
    assert db.query(ResourceModerationAction).filter_by(resource_id=resource_id, action_type="score_override").count() == 1
    history = client.get(f"/v1/admin/resources/{resource_id}/evaluations")
    assert history.status_code == 200
    assert history.json()["items"][0]["final_score"] == 86
    identity["user"] = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    assert client.post(f"/v1/admin/resources/{resource_id}/moderate", json={"action": "reject", "reason": "test"}).status_code == 403
