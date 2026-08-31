"""Deterministic, versioned prerequisite plans derived from confirmed goals."""

from dataclasses import dataclass
import unicodedata
import uuid

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import LearnerGoalSkill, Skill, SkillAlias, UserProfile


ANALYZER_VERSION = "trellis-goal-skills/v1"


class SkillRequirement(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target_level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced|expert)$")
    importance: float = Field(default=0.8, ge=0, le=1)
    prerequisites: list[str] = Field(default_factory=list)
    resource_intent: str = Field(default="explanation", pattern="^(explanation|tutorial|project|documentation)$")
    confidence: float = Field(default=0.85, ge=0, le=1)


def _requirement(name: str, prerequisites: list[str] | None = None, intent: str = "explanation", importance: float = 0.8) -> SkillRequirement:
    return SkillRequirement(name=name, prerequisites=prerequisites or [], resource_intent=intent, importance=importance)


JAVA_BACKEND_PLAN = [
    _requirement("Java fundamentals", importance=1),
    _requirement("Object-oriented programming", ["Java fundamentals"], importance=1),
    _requirement("Java collections", ["Java fundamentals", "Object-oriented programming"]),
    _requirement("Exception handling", ["Java fundamentals"]),
    _requirement("Spring Boot", ["Java fundamentals", "Object-oriented programming"], "tutorial", 1),
    _requirement("REST APIs", ["Spring Boot"], "tutorial", 1),
    _requirement("JPA", ["Spring Boot", "SQL"], "tutorial"),
    _requirement("SQL", importance=0.9),
    _requirement("Authentication", ["REST APIs", "Spring Boot"], "tutorial", 0.9),
    _requirement("Testing", ["Java fundamentals", "Spring Boot"], "tutorial", 0.9),
    _requirement("Docker", ["REST APIs"], "tutorial"),
    _requirement("Git", importance=0.8),
    _requirement("Backend project", ["Spring Boot", "REST APIs", "JPA", "Authentication", "Testing", "Docker", "Git"], "project", 1),
]

GENERIC_BACKEND_PLAN = [
    _requirement("Python", importance=1),
    _requirement("API design", ["Python"], "tutorial", 1),
    _requirement("Databases", ["Python"], "tutorial", 0.9),
    _requirement("Testing", ["API design"], "tutorial", 0.9),
    _requirement("Deployment", ["Testing", "Databases"], "project", 0.85),
]


class GoalSkillPlanner:
    """Conservative fallback analyzer used even when an LLM/provider is unavailable."""

    def analyze(self, target_role: str, objective: str | None = None) -> list[SkillRequirement]:
        goal = f"{target_role} {objective or ''}".casefold()
        if "java" in goal and ("backend" in goal or "spring" in goal):
            return [item.model_copy(deep=True) for item in JAVA_BACKEND_PLAN]
        if "backend" in goal:
            return [item.model_copy(deep=True) for item in GENERIC_BACKEND_PLAN]
        foundation = f"{target_role.strip()} foundations"
        return [
            _requirement(foundation, importance=1),
            _requirement(f"Applied {target_role.strip()} project", [foundation], "project", 1),
        ]


def _canonical_name(name: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", name).casefold().strip().split())


class GoalSkillService:
    def __init__(self, db: Session, planner: GoalSkillPlanner | None = None) -> None:
        self.db = db
        self.planner = planner or GoalSkillPlanner()

    def persist(self, profile: UserProfile) -> list[LearnerGoalSkill]:
        if not profile.target_role:
            return []
        existing = self.db.query(LearnerGoalSkill).filter(
            LearnerGoalSkill.user_id == profile.user_id,
            LearnerGoalSkill.profile_version == profile.profile_version,
        ).order_by(LearnerGoalSkill.sequence).all()
        if existing:
            return existing
        requirements = self.planner.analyze(profile.target_role, profile.objective)
        skills_by_name = {item.name: self._resolve_skill(item.name) for item in requirements}
        rows: list[LearnerGoalSkill] = []
        for sequence, requirement in enumerate(requirements, start=1):
            row = LearnerGoalSkill(
                id=str(uuid.uuid4()), user_id=profile.user_id, profile_version=profile.profile_version,
                skill_id=skills_by_name[requirement.name].id, target_level=requirement.target_level,
                importance=requirement.importance, sequence=sequence,
                prerequisite_skill_ids=[skills_by_name[name].id for name in requirement.prerequisites if name in skills_by_name],
                resource_intent=requirement.resource_intent, analyzer_version=ANALYZER_VERSION,
                confidence=requirement.confidence,
            )
            self.db.add(row)
            rows.append(row)
        self.db.flush()
        return rows

    def _resolve_skill(self, name: str) -> Skill:
        canonical = _canonical_name(name)
        alias = self.db.query(SkillAlias).filter(SkillAlias.alias == canonical).first()
        skill = alias.skill if alias else self.db.query(Skill).filter(Skill.canonical_name == canonical).first()
        if skill:
            return skill
        skill = Skill(id=str(uuid.uuid4()), canonical_name=canonical, display_name=name.strip())
        self.db.add(skill)
        self.db.flush()
        self.db.add(SkillAlias(id=str(uuid.uuid4()), skill_id=skill.id, alias=canonical))
        self.db.flush()
        return skill
