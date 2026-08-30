"""Persistent, owner-scoped career recommendations and evidence."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Protocol
from urllib.parse import urlparse
import uuid

import requests
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from career_schemas import (
    ApplicationCreate, ApplicationResponse, InterviewAnswer, InterviewInteraction,
    InterviewReport, InterviewStart, JobRecommendation, JobRecommendationPage,
)
from config import settings
from database import Application, InterviewEvidenceSession, SkillEvidence
from errors import APIError
from job_recommender import job_engine
from profile_service import LearnerProfileService
from roadmap_engine import canonical_skill_name


class JobProvider(Protocol):
    async def search(self, role: str, limit: int) -> list[dict]: ...


class JSearchJobProvider:
    """Retrieve real postings only; absence/failure yields an empty result."""

    async def search(self, role: str, limit: int) -> list[dict]:
        if not settings.JSEARCH_API_KEY:
            return []
        return await asyncio.wait_for(
            asyncio.to_thread(job_engine._search_jsearch_jobs, role, "", limit),
            timeout=settings.PROVIDER_TIMEOUT_SECONDS + 1,
        )


QUESTIONS = (
    "How would you approach a realistic {focus} problem for a {role} role?",
    "What tradeoffs, failure modes, and validation steps matter most in {focus}?",
    "Describe how you would improve and verify a weak implementation involving {focus}.",
)


def _valid_https_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.hostname)


class CareerService:
    def __init__(self, db: Session) -> None:
        self.db = db

    async def jobs(self, identity: AuthenticatedUser, provider: JobProvider, limit: int) -> JobRecommendationPage:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        self.db.commit()
        role = profile.target_role or profile.current_role or "Software Engineer"
        try:
            candidates = await provider.search(role, limit)
        except Exception:
            candidates = []
        learner_skills = {canonical_skill_name(item.display_name) for item in profile.learner_skills}
        items: list[JobRecommendation] = []
        for index, candidate in enumerate(candidates[:limit]):
            url = str(candidate.get("url") or "")
            if not _valid_https_url(url):
                continue
            required = [str(skill) for skill in candidate.get("required_skills") or []][:25]
            matched = [skill for skill in required if canonical_skill_name(skill) in learner_skills]
            score = min(0.55 + len(matched) * 0.1, 0.95)
            items.append(JobRecommendation(
                id=str(candidate.get("id") or url or index), title=str(candidate.get("title") or role),
                company=str(candidate.get("company") or "Unknown company"), location=str(candidate.get("location") or "Not specified"),
                job_type=str(candidate.get("job_type") or "Not specified"), required_skills=required,
                salary_range=candidate.get("salary_range"), description=str(candidate.get("description") or "")[:2000],
                url=url, posted_date=candidate.get("posted_date"), source=str(candidate.get("source") or "JSearch"),
                match_score=score, explanation=(f"Matches demonstrated skills: {', '.join(matched[:3])}." if matched else f"Aligned with your confirmed {role} goal; review skill requirements before applying."),
            ))
        return JobRecommendationPage(items=items, total=len(items))

    def create_application(self, identity: AuthenticatedUser, request: ApplicationCreate) -> ApplicationResponse:
        LearnerProfileService(self.db).ensure_profile(identity)
        application = Application(
            id=str(uuid.uuid4()), user_id=identity.user_id, company=request.company, position=request.position,
            status=request.status, url=str(request.url) if request.url else None, feedback=request.feedback,
            interview_topics=request.interview_topics, match_score=request.match_score, notes=request.notes,
        )
        self.db.add(application)
        self.db.flush()
        if request.feedback:
            for topic in request.interview_topics:
                skill = LearnerProfileService(self.db)._resolve_skill(topic)
                self.db.add(SkillEvidence(
                    id=str(uuid.uuid4()), user_id=identity.user_id, skill_id=skill.id,
                    evidence_type="career_feedback", source_type="application_feedback", source_id=application.id,
                    score=None, confidence=0.45, weight=0.3, rationale="A hiring-process topic was identified for further practice.",
                    evidence_metadata={"application_status": request.status},
                ))
        self.db.commit()
        self.db.refresh(application)
        return self._application(application)

    def start_interview(self, identity: AuthenticatedUser, request: InterviewStart) -> InterviewInteraction:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        role = request.target_role or profile.target_role or "Software Engineer"
        session = InterviewEvidenceSession(
            id=str(uuid.uuid4()), user_id=identity.user_id, target_role=role, status="in_progress",
            transcript=[{"kind": "config", "focus_area": request.focus_area, "difficulty": request.difficulty}],
            topic_scores={}, evidence_ids=[], created_at=datetime.utcnow(),
        )
        self.db.add(session)
        self.db.commit()
        return self._interaction(session, question=self._question(session, 0))

    def answer_interview(self, identity: AuthenticatedUser, session_id: str, request: InterviewAnswer) -> InterviewInteraction:
        session = self._owned_session(identity, session_id)
        if session.status == "completed":
            raise APIError(status_code=409, code="INTERVIEW_COMPLETED", message="This interview is already complete")
        transcript = list(session.transcript or [])
        answers = [turn for turn in transcript if turn.get("kind") == "answer"]
        index = len(answers)
        question = self._question(session, index)
        score = self._score_answer(request.answer)
        focus = str(transcript[0].get("focus_area") or "role fundamentals")
        feedback = "Clear evidence and verification steps were included." if score >= 0.75 else "Add concrete decisions, tradeoffs, and a way to verify the outcome."
        transcript.append({"kind": "question", "content": question, "topic": focus})
        transcript.append({"kind": "answer", "content": request.answer, "score": score, "feedback": feedback})
        session.transcript = transcript
        scores = [float(turn["score"]) for turn in transcript if turn.get("kind") == "answer"]
        session.topic_scores = {focus: round(sum(scores) / len(scores), 3)}
        if len(scores) >= len(QUESTIONS):
            session.status = "completed"
            session.overall_score = round(sum(scores) / len(scores), 3)
            session.completed_at = datetime.utcnow()
            skill = LearnerProfileService(self.db)._resolve_skill(focus)
            evidence = SkillEvidence(
                id=str(uuid.uuid4()), user_id=identity.user_id, skill_id=skill.id,
                evidence_type="interview_score", source_type="interview", source_id=session.id,
                score=session.overall_score, confidence=0.65, weight=0.55,
                rationale="Score derived from a deterministic mock interview rubric; lower weight than direct assessment evidence.",
                evidence_metadata={"target_role": session.target_role, "answer_count": len(scores)},
            )
            self.db.add(evidence)
            self.db.flush()
            session.evidence_ids = [evidence.id]
        self.db.commit()
        next_question = None if session.status == "completed" else self._question(session, len(scores))
        return self._interaction(session, question=next_question, previous_score=score, previous_feedback=feedback)

    def interview(self, identity: AuthenticatedUser, session_id: str) -> InterviewReport:
        session = self._owned_session(identity, session_id)
        score = session.overall_score
        return InterviewReport(
            session_id=session.id, target_role=session.target_role, status=session.status,
            overall_score=score, topic_scores=session.topic_scores or {},
            strengths=["Structured reasoning"] if score is not None and score >= 0.65 else [],
            improvements=[] if score is not None and score >= 0.75 else ["Use concrete examples and explicit verification steps"],
            summary=("Interview complete. Results are supporting evidence and do not replace direct assessments." if session.status == "completed" else "Interview in progress."),
            transcript=[turn for turn in (session.transcript or []) if turn.get("kind") != "config"],
            created_at=session.created_at, completed_at=session.completed_at,
        )

    def _owned_session(self, identity: AuthenticatedUser, session_id: str) -> InterviewEvidenceSession:
        session = self.db.query(InterviewEvidenceSession).filter(InterviewEvidenceSession.id == session_id, InterviewEvidenceSession.user_id == identity.user_id).first()
        if session is None:
            raise APIError(status_code=404, code="INTERVIEW_NOT_FOUND", message="Interview session was not found")
        return session

    @staticmethod
    def _score_answer(answer: str) -> float:
        normalized = answer.casefold()
        signals = sum(term in normalized for term in ("test", "verify", "tradeoff", "monitor", "failure", "measure", "index", "transaction"))
        return round(min(0.4 + len(answer.split()) / 100 + signals * 0.06, 0.95), 3)

    @staticmethod
    def _question(session: InterviewEvidenceSession, index: int) -> str:
        config = (session.transcript or [{}])[0]
        return QUESTIONS[index].format(focus=config.get("focus_area", "role fundamentals"), role=session.target_role)

    @staticmethod
    def _interaction(session: InterviewEvidenceSession, *, question: str | None, previous_score: float | None = None, previous_feedback: str | None = None) -> InterviewInteraction:
        answered = len([turn for turn in (session.transcript or []) if turn.get("kind") == "answer"])
        return InterviewInteraction(session_id=session.id, status=session.status, question=question, question_number=min(answered + 1, len(QUESTIONS)), question_count=len(QUESTIONS), previous_score=previous_score, previous_feedback=previous_feedback)

    @staticmethod
    def _application(application: Application) -> ApplicationResponse:
        return ApplicationResponse(id=application.id, company=application.company, position=application.position, status=application.status, url=application.url, feedback=application.feedback, interview_topics=application.interview_topics or [], match_score=application.match_score, created_at=application.applied_date)
