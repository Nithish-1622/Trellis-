"""Index-first coverage checks used to bound external resource discovery."""

from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import LearnerGoalSkill, LearningResource, ResourceSkillMap, Skill
from resource_policy import INELIGIBLE_LINK_STATUSES, learner_eligible_resource_condition


PRACTICAL_TYPES = {"project", "exercise", "assessment"}
INSTRUCTIONAL_TYPES = {"course", "video", "article"}


class SkillCoverage(BaseModel):
    goal_skill_id: str
    skill_id: str
    skill: str
    covered: bool
    eligible_count: int
    practical_count: int
    instructional_count: int
    required_count: int = 2
    practical_required: bool


class ResourceCoverageService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def analyze(self, user_id: str, profile_version: int) -> list[SkillCoverage]:
        requirements = self.db.query(LearnerGoalSkill, Skill).join(
            Skill, LearnerGoalSkill.skill_id == Skill.id
        ).filter(
            LearnerGoalSkill.user_id == user_id,
            LearnerGoalSkill.profile_version == profile_version,
        ).order_by(LearnerGoalSkill.sequence).all()
        output: list[SkillCoverage] = []
        for requirement, skill in requirements:
            resources = self.db.query(LearningResource).join(
                ResourceSkillMap, ResourceSkillMap.resource_id == LearningResource.id
            ).filter(
                ResourceSkillMap.skill_id == skill.id,
                ResourceSkillMap.relevance_score >= 75,
                LearningResource.archived_at.is_(None),
                LearningResource.suppressed_at.is_(None),
                LearningResource.link_status.notin_(INELIGIBLE_LINK_STATUSES),
                learner_eligible_resource_condition(),
            ).all()
            practical_count = sum(resource.resource_type in PRACTICAL_TYPES for resource in resources)
            instructional_count = sum(resource.resource_type in INSTRUCTIONAL_TYPES for resource in resources)
            practical_required = requirement.resource_intent == "project"
            output.append(SkillCoverage(
                goal_skill_id=requirement.id, skill_id=skill.id, skill=skill.display_name,
                covered=(
                    len(resources) >= 2
                    and instructional_count >= 1
                    and (not practical_required or practical_count >= 1)
                ),
                eligible_count=len(resources), practical_count=practical_count,
                instructional_count=instructional_count,
                practical_required=practical_required,
            ))
        return output

    def uncovered(self, user_id: str, profile_version: int) -> list[SkillCoverage]:
        return [item for item in self.analyze(user_id, profile_version) if not item.covered]
