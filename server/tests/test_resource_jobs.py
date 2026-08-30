from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser
from database import (
    Base,
    LearnerGoalSkill,
    LearningResource,
    ResourceEvaluation,
    ResourceJob,
    ResourceSkillMap,
    Skill,
)
from goal_skill_planner import GoalSkillService
from profile_service import LearnerProfileService
from resource_jobs import ResourceDiscoveryService, ResourceJobService
from resource_providers import ExternalResource, ResourceMetrics
from resource_vetting import EvaluationResult


@pytest.fixture
def job_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    db = session_factory()
    identity = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    profile = LearnerProfileService(db).ensure_profile(identity)
    profile.target_role = "Cloud specialist"
    profile.objective = "Ship a practical portfolio"
    profile.preferred_language = "English"
    profile.profile_version = 2
    GoalSkillService(db).persist(profile)
    db.commit()
    try:
        yield db, profile
    finally:
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_discovery_jobs_are_idempotent_per_profile_version_and_claimed_once(job_db):
    db, profile = job_db
    service = ResourceJobService(db)

    first = service.enqueue_discovery(profile.user_id, profile.profile_version)
    second = service.enqueue_discovery(profile.user_id, profile.profile_version)
    claimed = service.claim_next("worker-a")
    claimed_again = service.claim_next("worker-b")

    assert first.id == second.id
    assert db.query(ResourceJob).count() == 1
    assert claimed.id == first.id
    assert claimed.status == "running"
    assert claimed.attempts == 1
    assert claimed_again is None


def test_failed_jobs_retry_with_a_bound_and_remain_inspectable(job_db):
    db, profile = job_db
    service = ResourceJobService(db)
    job = service.enqueue_discovery(profile.user_id, profile.profile_version)
    for attempt in range(1, 4):
        claimed = service.claim_next("worker")
        assert claimed is not None
        service.fail(claimed, "provider timeout")
        db.refresh(job)
        assert job.attempts == attempt
        if attempt < 3:
            assert job.status == "queued"
            job.run_at = datetime.utcnow()
            db.commit()

    assert job.status == "dead"
    assert job.last_error_code == "PROVIDER_TIMEOUT"


def test_recurring_maintenance_is_deduplicated(job_db):
    db, _profile = job_db
    service = ResourceJobService(db)

    service.schedule_recurring()
    service.schedule_recurring()

    assert db.query(ResourceJob).filter_by(job_type="interaction_cleanup").count() == 1


@pytest.mark.asyncio
async def test_discovery_searches_only_gaps_and_persists_vetted_evidence(job_db):
    db, profile = job_db
    requirements = db.query(LearnerGoalSkill).filter_by(user_id=profile.user_id, profile_version=2).order_by(LearnerGoalSkill.sequence).all()
    covered = requirements[0]
    for number in range(2):
        resource = LearningResource(
            id=f"catalog-{number}", provider="catalog", external_id=f"catalog-{number}", canonical_key=f"catalog:{number}",
            resource_type="course", title=f"Foundation {number}", url=f"https://example.test/{number}",
            verification_status="verified", link_status="healthy", language="English", topics=[],
        )
        db.add(resource)
        db.flush()
        db.add(ResourceSkillMap(id=f"existing-map-{number}", resource_id=resource.id, skill_id=covered.skill_id, relevance_score=90, evidence={}))
    db.commit()

    calls = []

    class Provider:
        async def search(self, request, limit):
            calls.append(request.skill)
            return [ExternalResource(
                provider="youtube", external_id="video-1", resource_type="video", title=f"Learn {request.skill}",
                description="A practical guide", url="https://youtube.com/watch?v=video-1", author="Teacher",
                published_at=datetime.now(timezone.utc), duration_seconds=1200, topics=[request.skill],
                metrics=ResourceMetrics(views=1000, likes=100, comments=20),
            )]

    class Vetter:
        async def evaluate(self, candidate, context):
            return EvaluationResult(
                relevance_score=92, content_quality_score=88, engagement_score=80, creator_score=75,
                freshness_score=95, final_score=87, confidence=.8, status="vetted", model_version="test-model",
                input_fingerprint="fingerprint", transcript_available=True, transcript_language="en",
                transcript_content_hash="hash", coverage=[context.skill], evidence={"analysis": {"relevance": 92}},
            )

    job_service = ResourceJobService(db)
    job = job_service.enqueue_discovery(profile.user_id, profile.profile_version)
    claimed = job_service.claim_next("worker-a")
    await ResourceDiscoveryService(db, Provider(), Vetter()).run(claimed)

    db.refresh(job)
    indexed = db.query(LearningResource).filter_by(canonical_key="youtube:video-1").one()
    assert calls == [requirements[1].skill.display_name]
    assert job.status == "completed"
    assert indexed.verification_status == "vetted"
    assert indexed.resource_score == 87
    assert db.query(ResourceEvaluation).filter_by(resource_id=indexed.id).count() == 1
    assert db.query(ResourceSkillMap).filter_by(resource_id=indexed.id, skill_id=requirements[1].skill_id).one().relevance_score == 92


@pytest.mark.asyncio
async def test_provider_outage_completes_job_with_inspectable_coverage_gap(job_db):
    db, profile = job_db

    class EmptyProvider:
        async def search(self, _request, _limit):
            return []

    class UnusedVetter:
        async def evaluate(self, _candidate, _context):
            raise AssertionError("No candidate should be evaluated")

    jobs = ResourceJobService(db)
    job = jobs.enqueue_discovery(profile.user_id, profile.profile_version)
    await ResourceDiscoveryService(db, EmptyProvider(), UnusedVetter()).run(jobs.claim_next("worker"))
    db.refresh(job)

    assert job.status == "completed"
    assert job.result["coverage_gaps"]
    assert job.last_error_code is None
