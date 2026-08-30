"""Deterministic quiz scoring and optional AI-assisted project rubrics."""

import asyncio
from datetime import datetime
import logging
from typing import Protocol
import uuid

from langchain_groq import ChatGroq
from sqlalchemy.orm import Session

from assessment_schemas import (
    AssessmentAttemptResponse,
    ProjectGrade,
    ProjectSubmissionRequest,
    QuizAttemptRequest,
    QuizQuestionResponse,
    QuizResponse,
    RubricCriterion,
)
from auth import AuthenticatedUser
from config import settings
from database import AssessmentAttempt, Roadmap, RoadmapMilestone, RoadmapVersion, SkillEvidence
from errors import APIError
from profile_service import LearnerProfileService
from roadmap_engine import canonical_skill_name


logger = logging.getLogger(__name__)


QUIZ_BANK = {
    "python": [
        {"id": "python-1", "prompt": "Which built-in collection is immutable?", "options": ["tuple", "list", "set", "dict"], "correct": "tuple"},
        {"id": "python-2", "prompt": "Which statement manages a context manager?", "options": ["with", "match", "yield", "lambda"], "correct": "with"},
        {"id": "python-3", "prompt": "Which tool is commonly used for Python tests?", "options": ["pytest", "pip", "ruff-only", "venv"], "correct": "pytest"},
    ],
    "default": [
        {"id": "general-1", "prompt": "What best demonstrates a learned skill?", "options": ["A working project with tests", "A saved bookmark", "A course title", "A copied snippet"], "correct": "A working project with tests"},
        {"id": "general-2", "prompt": "What should happen before an advanced topic?", "options": ["Confirm prerequisites", "Skip practice", "Ignore feedback", "Remove milestones"], "correct": "Confirm prerequisites"},
        {"id": "general-3", "prompt": "Which feedback is most actionable?", "options": ["Specific evidence tied to an outcome", "A vague rating", "No explanation", "A generic compliment"], "correct": "Specific evidence tied to an outcome"},
    ],
}


class StructuredProjectModel(Protocol):
    async def ainvoke(self, prompt: str) -> ProjectGrade: ...


class ProjectGrader:
    def __init__(self, model: StructuredProjectModel | None = None) -> None:
        self.model = model
        if self.model is None and settings.ENABLE_AI_PROJECT_GRADING and settings.GROQ_API_KEY:
            chat = ChatGroq(model=settings.GROQ_MODEL, api_key=settings.GROQ_API_KEY, temperature=0, timeout=10, max_retries=1)
            self.model = chat.with_structured_output(ProjectGrade)

    async def grade(self, milestone: RoadmapMilestone, submission: ProjectSubmissionRequest) -> ProjectGrade:
        baseline = self._baseline(submission)
        if self.model is None:
            return baseline
        prompt = (
            "Review this learning project against the milestone. Return a cautious rubric. "
            "Never claim to have executed or inspected repository contents. Scores are provisional.\n"
            f"Milestone: {milestone.title}\nSkills: {milestone.target_skills}\n"
            f"Repository: {submission.repository_url}\nLearner summary: {submission.summary}"
        )
        try:
            return await asyncio.wait_for(self.model.ainvoke(prompt), timeout=12)
        except Exception as exc:
            logger.warning("Project grading provider failed: %s", type(exc).__name__)
            return baseline

    @staticmethod
    def _baseline(submission: ProjectSubmissionRequest) -> ProjectGrade:
        repository_score = 0.8 if "github.com" in str(submission.repository_url) else 0.6
        explanation_score = min(0.5 + len(submission.summary) / 500, 0.9)
        reflection_score = 0.75 if submission.reflection and len(submission.reflection) >= 20 else 0.5
        rubric = [
            RubricCriterion(criterion="Evidence link", score=repository_score, rationale="A reviewable repository URL was supplied."),
            RubricCriterion(criterion="Implementation explanation", score=explanation_score, rationale="Scored from the specificity of the learner-provided summary."),
            RubricCriterion(criterion="Reflection", score=reflection_score, rationale="Reflection supports, but does not prove, proficiency."),
        ]
        score = sum(item.score for item in rubric) / len(rubric)
        return ProjectGrade(score=score, confidence=0.6, rationale="Provisional rubric based only on submitted evidence and learner description; repository execution was not performed.", rubric=rubric)


def get_project_grader() -> ProjectGrader:
    return ProjectGrader()


class AssessmentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def quiz(self, identity: AuthenticatedUser, milestone_id: str) -> QuizResponse:
        milestone = self._owned_milestone(identity, milestone_id)
        questions = self._questions(milestone)
        return QuizResponse(milestone_id=milestone.id, questions=[QuizQuestionResponse(id=item["id"], prompt=item["prompt"], options=item["options"]) for item in questions])

    def submit_quiz(self, identity: AuthenticatedUser, milestone_id: str, request: QuizAttemptRequest) -> AssessmentAttemptResponse:
        milestone = self._owned_milestone(identity, milestone_id)
        questions = self._questions(milestone)
        correct_by_id = {item["id"]: item["correct"] for item in questions}
        submitted = {item.question_id: item.answer for item in request.answers}
        correct = sum(submitted.get(question_id) == answer for question_id, answer in correct_by_id.items())
        score = correct / len(questions)
        attempt = AssessmentAttempt(
            id=str(uuid.uuid4()), user_id=identity.user_id, milestone_id=milestone.id, assessment_type="quiz",
            questions=[{"id": item["id"], "prompt": item["prompt"], "options": item["options"], "correct_answer": item["correct"]} for item in questions],
            answers=[item.model_dump() for item in request.answers], rubric=[], score=score,
            rationale=f"{correct} of {len(questions)} deterministic questions were correct.", confidence=0.95,
            provisional=False, reflection=request.reflection, created_at=datetime.utcnow(),
        )
        self.db.add(attempt)
        self.db.flush()
        self._record_evidence(identity.user_id, milestone, attempt, "quiz", score, 0.95, 1.0)
        self.db.commit()
        self.db.refresh(attempt)
        return self._response(attempt)

    async def submit_project(self, identity: AuthenticatedUser, milestone_id: str, request: ProjectSubmissionRequest, grader: ProjectGrader) -> AssessmentAttemptResponse:
        milestone = self._owned_milestone(identity, milestone_id)
        grade = await grader.grade(milestone, request)
        attempt = AssessmentAttempt(
            id=str(uuid.uuid4()), user_id=identity.user_id, milestone_id=milestone.id, assessment_type="project",
            questions=[], answers=[{"repository_url": str(request.repository_url), "summary": request.summary}],
            rubric=[item.model_dump() for item in grade.rubric], score=grade.score, rationale=grade.rationale,
            confidence=min(grade.confidence, 0.75), provisional=True, reflection=request.reflection, created_at=datetime.utcnow(),
        )
        self.db.add(attempt)
        self.db.flush()
        self._record_evidence(identity.user_id, milestone, attempt, "project_review", grade.score, min(grade.confidence, 0.75), 0.7)
        self.db.commit()
        self.db.refresh(attempt)
        return self._response(attempt)

    def _record_evidence(self, user_id: str, milestone: RoadmapMilestone, attempt: AssessmentAttempt, source_type: str, score: float, confidence: float, weight: float) -> None:
        profile_service = LearnerProfileService(self.db)
        for skill_name in milestone.target_skills or []:
            skill = profile_service._resolve_skill(skill_name)
            self.db.add(SkillEvidence(
                id=str(uuid.uuid4()), user_id=user_id, skill_id=skill.id, evidence_type="assessment_score",
                source_type=source_type, source_id=attempt.id, score=score, confidence=confidence, weight=weight,
                rationale=attempt.rationale, evidence_metadata={"milestone_id": milestone.id, "provisional": attempt.provisional},
            ))

    def _owned_milestone(self, identity: AuthenticatedUser, milestone_id: str) -> RoadmapMilestone:
        milestone = self.db.query(RoadmapMilestone).join(RoadmapVersion, RoadmapMilestone.version_id == RoadmapVersion.id).join(Roadmap, RoadmapVersion.roadmap_id == Roadmap.id).filter(RoadmapMilestone.id == milestone_id, Roadmap.user_id == identity.user_id).first()
        if milestone is None:
            raise APIError(status_code=404, code="MILESTONE_NOT_FOUND", message="Milestone was not found")
        return milestone

    @staticmethod
    def _questions(milestone: RoadmapMilestone) -> list[dict]:
        skill = canonical_skill_name((milestone.target_skills or [""])[0])
        return QUIZ_BANK.get(skill, QUIZ_BANK["default"])

    @staticmethod
    def _response(attempt: AssessmentAttempt) -> AssessmentAttemptResponse:
        return AssessmentAttemptResponse(
            id=attempt.id, milestone_id=attempt.milestone_id, assessment_type=attempt.assessment_type,
            score=attempt.score, confidence=attempt.confidence, rationale=attempt.rationale,
            rubric=attempt.rubric or [], provisional=attempt.provisional,
            reflection=attempt.reflection, created_at=attempt.created_at,
        )
