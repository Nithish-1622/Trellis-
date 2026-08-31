from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth import AuthenticatedUser
from database import Base, LearnerGoalSkill, LearningResource, ResourceSkillMap, Skill
from goal_skill_planner import GoalSkillPlanner, GoalSkillService
from profile_service import LearnerProfileService
from resource_coverage import ResourceCoverageService


def database_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine)()


def test_java_backend_plan_is_explicit_ordered_and_prerequisite_aware():
    plan = GoalSkillPlanner().analyze("Backend Java Developer", "Become internship-ready")

    names = [item.name for item in plan]
    assert names == [
        "Java fundamentals", "Object-oriented programming", "Java collections", "Exception handling",
        "Spring Boot", "REST APIs", "JPA", "SQL", "Authentication", "Testing", "Docker", "Git", "Backend project",
    ]
    spring = next(item for item in plan if item.name == "Spring Boot")
    project = next(item for item in plan if item.name == "Backend project")
    assert spring.prerequisites == ["Java fundamentals", "Object-oriented programming"]
    assert "Spring Boot" in project.prerequisites
    assert project.resource_intent == "project"


def test_confirmed_profile_persists_one_goal_plan_per_profile_version():
    engine, db = database_session()
    identity = AuthenticatedUser(user_id="learner", email="learner@example.com", name="Learner", roles=["learner"])
    profile_service = LearnerProfileService(db)
    profile = profile_service.ensure_profile(identity)
    profile.target_role = "Backend Java Developer"
    profile.objective = "Become internship-ready"
    profile.profile_version = 2
    GoalSkillService(db).persist(profile)
    GoalSkillService(db).persist(profile)
    db.commit()

    rows = db.query(LearnerGoalSkill).filter_by(user_id="learner", profile_version=2).order_by(LearnerGoalSkill.sequence).all()
    assert len(rows) == 13
    assert rows[0].skill.display_name == "Java fundamentals"
    db.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


def test_coverage_requires_two_eligible_resources_and_a_practical_resource_when_requested():
    engine, db = database_session()
    skill = Skill(id="skill-spring", canonical_name="spring boot", display_name="Spring Boot")
    goal = LearnerGoalSkill(id="goal-spring", user_id="learner", skill_id=skill.id, profile_version=1, target_level="intermediate", importance=1, sequence=1, prerequisite_skill_ids=[], resource_intent="project", analyzer_version="test", confidence=1)
    from database import UserProfile
    db.add(UserProfile(user_id="learner", profile_version=1))
    db.add(skill)
    db.flush()
    db.add(goal)
    resources = [
        LearningResource(id="verified-video", provider="youtube", external_id="v1", canonical_key="youtube:v1", resource_type="video", title="Spring", url="https://youtube.com/watch?v=v1", verification_status="vetted", resource_score=72, score_confidence=.8, link_status="healthy", language="English", topics=[]),
        LearningResource(id="vetted-project", provider="github", external_id="p1", canonical_key="github:e/p1", resource_type="project", title="Spring project", url="https://github.com/e/p1", verification_status="vetted", resource_score=88, score_confidence=.7, link_status="healthy", language="English", topics=[]),
        LearningResource(id="discovered-project", provider="github", external_id="p2", canonical_key="github:e/p2", resource_type="project", title="Hidden", url="https://github.com/e/p2", verification_status="discovered", resource_score=95, score_confidence=.9, link_status="healthy", language="English", topics=[]),
    ]
    db.add_all(resources)
    db.flush()
    for index, resource in enumerate(resources):
        db.add(ResourceSkillMap(id=f"map-{index}", resource_id=resource.id, skill_id=skill.id, relevance_score=90, evidence={}))
    db.commit()

    coverage = ResourceCoverageService(db).analyze("learner", 1)

    assert coverage[0].covered is True
    assert coverage[0].eligible_count == 2
    assert coverage[0].practical_count == 1
    db.close()
    Base.metadata.drop_all(engine)
    engine.dispose()
