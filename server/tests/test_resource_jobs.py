from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, event
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
from resource_jobs import DISCOVERY_PIPELINE_VERSION, ResourceDiscoveryService, ResourceJobService
from resource_coverage import ResourceCoverageService
from resource_providers import ExternalResource, ResourceMetrics
from resource_vetting import EvaluationResult, SCORE_VERSION


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


def test_current_discovery_version_does_not_reuse_legacy_completed_job(job_db):
    db, profile = job_db
    legacy = ResourceJob(
        id="legacy-job", user_id=profile.user_id, job_type="discovery",
        dedupe_key=f"{profile.user_id}:profile:{profile.profile_version}:discovery-v1",
        status="completed", payload={"profile_version": profile.profile_version},
        result={"vetted": 0, "coverage_gaps": []}, progress=100,
    )
    db.add(legacy)
    db.commit()

    current = ResourceJobService(db).enqueue_discovery(profile.user_id, profile.profile_version)

    assert current.id != legacy.id
    assert current.status == "queued"
    assert current.dedupe_key.endswith(f"discovery-{DISCOVERY_PIPELINE_VERSION}")


def test_project_only_catalog_does_not_satisfy_instructional_coverage(job_db):
    db, profile = job_db
    requirement = db.query(LearnerGoalSkill).filter_by(
        user_id=profile.user_id, profile_version=profile.profile_version,
    ).order_by(LearnerGoalSkill.sequence).first()
    for number in range(2):
        resource = LearningResource(
            id=f"project-{number}", provider="github", external_id=f"project-{number}",
            canonical_key=f"github:project-{number}", resource_type="project",
            title=f"Project {number}", url=f"https://github.com/example/project-{number}",
            verification_status="vetted", resource_score=90, score_confidence=.9,
            link_status="healthy", language="English", topics=[],
        )
        db.add(resource)
        db.flush()
        db.add(ResourceSkillMap(
            id=f"project-map-{number}", resource_id=resource.id,
            skill_id=requirement.skill_id, relevance_score=90, evidence={},
        ))
    db.commit()

    coverage = ResourceCoverageService(db).analyze(profile.user_id, profile.profile_version)
    item = next(entry for entry in coverage if entry.skill_id == requirement.skill_id)

    assert item.eligible_count == 2
    assert item.instructional_count == 0
    assert item.covered is False


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


def test_stale_worker_lease_is_reclaimed_but_fresh_lease_is_not(job_db):
    db, profile = job_db
    service = ResourceJobService(db)
    job = service.enqueue_discovery(profile.user_id, profile.profile_version)
    service.claim_next("dead-worker")
    job.locked_at = datetime.utcnow() - timedelta(seconds=301)
    db.commit()

    reclaimed = service.claim_next("replacement-worker")
    assert reclaimed.id == job.id
    assert reclaimed.locked_by == "replacement-worker"
    assert service.claim_next("other-worker") is None


def test_recurring_maintenance_is_deduplicated(job_db):
    db, _profile = job_db
    service = ResourceJobService(db)

    service.schedule_recurring()
    service.schedule_recurring()

    assert db.query(ResourceJob).filter_by(job_type="interaction_cleanup").count() == 1


def test_recurring_maintenance_does_not_distinct_full_resource_rows(job_db):
    db, _profile = job_db
    skill = db.query(Skill).first()
    resource = LearningResource(
        id="reevaluation-candidate", provider="youtube", external_id="candidate",
        canonical_key="youtube:candidate", resource_type="video", title="Candidate",
        url="https://youtube.com/watch?v=candidate", verification_status="vetted",
        link_status="healthy", language="English", topics=[],
    )
    db.add(resource)
    db.flush()
    db.add(ResourceSkillMap(
        id="reevaluation-map", resource_id=resource.id, skill_id=skill.id,
        relevance_score=90, evidence={},
    ))
    db.commit()
    statements: list[str] = []

    def capture_statement(_conn, _cursor, statement, _parameters, _context, _executemany):
        statements.append(statement)

    event.listen(db.bind, "before_cursor_execute", capture_statement)
    try:
        ResourceJobService(db).schedule_recurring()
    finally:
        event.remove(db.bind, "before_cursor_execute", capture_statement)

    candidate_queries = [
        statement for statement in statements
        if "FROM learning_resources" in statement and "resource_skill_map" in statement
    ]
    assert candidate_queries
    assert all("SELECT DISTINCT" not in statement.upper() for statement in candidate_queries)


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
            assert job.progress > 0
            return EvaluationResult(
                relevance_score=92, content_quality_score=88, engagement_score=80, creator_score=75,
                freshness_score=95, final_score=87, confidence=.8, status="vetted", model_version="test-model",
                input_fingerprint="fingerprint", transcript_available=True, transcript_language="en",
                transcript_content_hash="hash", coverage=[context.skill], evidence={"analysis": {"relevance": 92}},
            )

    job_service = ResourceJobService(db)
    job = job_service.enqueue_discovery(profile.user_id, profile.profile_version)
    claimed = job_service.claim_next("worker-a")
    discovery = ResourceDiscoveryService(db, Provider(), Vetter())
    await discovery.run(claimed)

    db.refresh(job)
    indexed = db.query(LearningResource).filter_by(canonical_key="youtube:video-1").one()
    assert calls == [requirements[1].skill.display_name]
    assert job.status == "completed"
    assert indexed.verification_status == "vetted"
    assert indexed.resource_score == 87
    assert db.query(ResourceEvaluation).filter_by(resource_id=indexed.id).count() == 1
    assert db.query(ResourceSkillMap).filter_by(resource_id=indexed.id, skill_id=requirements[1].skill_id).one().relevance_score == 92

    weaker = EvaluationResult(
        relevance_score=65, content_quality_score=60, engagement_score=50, creator_score=55,
        freshness_score=60, final_score=59, confidence=.8, status="rejected", model_version="test-model",
        input_fingerprint="different-fingerprint", transcript_available=False,
        coverage=[requirements[1].skill.display_name], evidence={},
    )
    discovery._persist_evaluation(indexed, requirements[1].skill_id, weaker)
    discovery._persist_evaluation(indexed, requirements[1].skill_id, weaker)
    db.commit()
    db.refresh(indexed)
    assert indexed.verification_status == "vetted"
    assert indexed.resource_score == 87
    assert db.query(ResourceEvaluation).filter_by(resource_id=indexed.id).count() == 2


def test_current_evaluation_version_replaces_stale_resource_status(job_db):
    db, _profile = job_db
    skill = db.query(Skill).first()
    resource = LearningResource(
        id="versioned-video", provider="youtube", external_id="versioned-video",
        canonical_key="youtube:versioned-video", resource_type="video", title="Versioned video",
        url="https://youtube.com/watch?v=versioned-video", verification_status="vetted",
        resource_score=95, score_confidence=.9, link_status="healthy", language="English", topics=[],
    )
    db.add(resource)
    db.flush()
    db.add(ResourceEvaluation(
        id="legacy-evaluation", resource_id=resource.id,
        evaluation_version="trellis-resource-score/legacy",
        relevance_score=95, content_quality_score=95, engagement_score=95,
        creator_score=95, freshness_score=95, final_score=95, confidence=.9,
        model_version=None, input_fingerprint="legacy-fingerprint", evidence={},
    ))
    db.commit()
    current = EvaluationResult(
        relevance_score=50, content_quality_score=50, engagement_score=50,
        creator_score=50, freshness_score=50, final_score=50, confidence=.8,
        status="rejected", model_version="current-model", input_fingerprint="current-fingerprint",
        transcript_available=False, coverage=[], evidence={},
    )

    ResourceDiscoveryService(db, object(), object())._persist_evaluation(resource, skill.id, current)
    db.commit()
    db.refresh(resource)

    assert current.score_version == SCORE_VERSION
    assert resource.verification_status == "rejected"
    assert resource.resource_score == 50
    assert resource.score_version == SCORE_VERSION


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


@pytest.mark.asyncio
async def test_discovery_never_overwrites_human_verified_resource(job_db):
    db, profile = job_db
    requirement = db.query(LearnerGoalSkill).filter_by(
        user_id=profile.user_id, profile_version=profile.profile_version,
    ).order_by(LearnerGoalSkill.sequence).first()
    resource = LearningResource(
        id="verified-video", provider="youtube", external_id="trusted", canonical_key="youtube:trusted",
        resource_type="video", title="Human reviewed title", description="Reviewed description",
        url="https://www.youtube.com/watch?v=trusted", author="Trusted teacher",
        verification_status="verified", link_status="healthy", language="English", topics=["reviewed"],
        resource_metadata={"curator_note": "keep this"},
    )
    db.add(resource)
    db.commit()

    class Provider:
        async def search(self, _request, _limit):
            return [ExternalResource(
                provider="youtube", external_id="trusted", resource_type="video",
                title="Provider changed title", description="Provider changed description",
                url="https://youtu.be/trusted", author="Changed teacher", topics=["changed"],
            )]

    class Vetter:
        async def evaluate(self, _candidate, context):
            return EvaluationResult(
                relevance_score=90, content_quality_score=85, engagement_score=80, creator_score=75,
                freshness_score=90, final_score=85, confidence=.7, status="vetted", model_version="test",
                input_fingerprint=(f"verified-{context.skill}" * 8)[:64], coverage=[context.skill], evidence={},
                transcript_available=False,
            )

    jobs = ResourceJobService(db)
    jobs.enqueue_discovery(profile.user_id, profile.profile_version)
    await ResourceDiscoveryService(db, Provider(), Vetter()).run(jobs.claim_next("worker"))
    db.refresh(resource)

    assert resource.title == "Human reviewed title"
    assert resource.description == "Reviewed description"
    assert resource.author == "Trusted teacher"
    assert resource.url == "https://www.youtube.com/watch?v=trusted"
    assert resource.topics == ["reviewed"]
    assert resource.resource_metadata == {"curator_note": "keep this"}
    assert resource.verification_status == "verified"
    assert db.query(ResourceSkillMap).filter_by(resource_id=resource.id, skill_id=requirement.skill_id).one()
