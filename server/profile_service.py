"""Learner profile and onboarding persistence services."""

from datetime import datetime, time
import unicodedata
import uuid

from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from database import (
    AppUser,
    LearnerSkill,
    LearningHistory,
    OnboardingSession,
    Skill,
    SkillAlias,
    SkillEvidence,
    UserProfile,
    UserRole,
)
from errors import APIError
from profile_schemas import (
    LearnerProfileResponse,
    LearnerSkillResponse,
    OnboardingDraft,
    OnboardingSessionResponse,
    OnboardingStep,
    OnboardingUpdate,
)


def _canonicalize_skill_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKC", name)
    return " ".join(normalized.casefold().strip().split())


class LearnerProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_identity(self, identity: AuthenticatedUser) -> AppUser:
        user = self.db.get(AppUser, identity.user_id)
        if user is None:
            user = AppUser(
                user_id=identity.user_id,
                email=identity.email,
                name=identity.name,
                is_active=True,
            )
            self.db.add(user)
        else:
            user.email = identity.email
            user.name = identity.name
            user.is_active = True

        existing_roles = {
            role.role
            for role in self.db.query(UserRole).filter(UserRole.user_id == identity.user_id)
        }
        for role in identity.roles:
            if role not in existing_roles:
                self.db.add(UserRole(user_id=identity.user_id, role=role))
        self.db.flush()
        return user

    def ensure_profile(self, identity: AuthenticatedUser) -> UserProfile:
        self.ensure_identity(identity)
        profile = self.db.get(UserProfile, identity.user_id)
        if profile is None:
            profile = UserProfile(
                user_id=identity.user_id,
                skills=[],
                career_goals=[],
                interests=[],
                preferred_formats=[],
                accessibility_needs=[],
            )
            self.db.add(profile)
            self.db.flush()
        return profile

    def get_onboarding(self, identity: AuthenticatedUser) -> OnboardingSessionResponse:
        self.ensure_identity(identity)
        session = (
            self.db.query(OnboardingSession)
            .filter(OnboardingSession.user_id == identity.user_id)
            .first()
        )
        self.db.commit()
        if session is None:
            return OnboardingSessionResponse(
                session_id=None,
                status="not_started",
                current_step=OnboardingStep.GOAL,
                completed_steps=[],
                draft=OnboardingDraft(),
                updated_at=None,
                completed_at=None,
            )
        return self._onboarding_response(session)

    def save_onboarding(
        self, identity: AuthenticatedUser, update: OnboardingUpdate
    ) -> OnboardingSessionResponse:
        self.ensure_identity(identity)
        session = (
            self.db.query(OnboardingSession)
            .filter(OnboardingSession.user_id == identity.user_id)
            .first()
        )
        now = datetime.utcnow()
        if session is None:
            session = OnboardingSession(
                id=str(uuid.uuid4()),
                user_id=identity.user_id,
                created_at=now,
            )
            self.db.add(session)

        session.current_step = update.current_step.value
        session.completed_steps = [step.value for step in update.completed_steps]
        session.draft = update.draft.model_dump(mode="json")
        session.updated_at = now

        if update.complete:
            self._validate_completion(update.draft)
            self._persist_completed_profile(identity, update.draft)
            session.status = "completed"
            session.completed_at = session.completed_at or now
            session.current_step = OnboardingStep.REVIEW.value
        elif session.status != "completed":
            session.status = "in_progress"

        self.db.commit()
        self.db.refresh(session)
        return self._onboarding_response(session)

    def get_profile(self, identity: AuthenticatedUser) -> LearnerProfileResponse:
        profile = self.ensure_profile(identity)
        self.db.commit()
        self.db.refresh(profile)
        return self._profile_response(profile)

    def _validate_completion(self, draft: OnboardingDraft) -> None:
        missing: list[str] = []
        if draft.goal is None or not draft.goal.target_role:
            missing.append("goal.target_role")
        if draft.goal is None or not draft.goal.objective:
            missing.append("goal.objective")
        if draft.current_position is None:
            missing.append("current_position")
        if draft.preferences is None or draft.preferences.weekly_hours is None:
            missing.append("preferences.weekly_hours")
        if missing:
            raise APIError(
                status_code=422,
                code="ONBOARDING_INCOMPLETE",
                message="Required onboarding fields are incomplete",
                details={"missing_fields": missing},
            )

    def _persist_completed_profile(
        self, identity: AuthenticatedUser, draft: OnboardingDraft
    ) -> None:
        profile = self.ensure_profile(identity)
        goal = draft.goal
        position = draft.current_position
        preferences = draft.preferences
        assert goal is not None and position is not None and preferences is not None

        profile.target_role = goal.target_role
        profile.objective = goal.objective
        profile.target_date = (
            datetime.combine(goal.target_date, time.min) if goal.target_date else None
        )
        profile.current_role = position.current_role
        profile.experience_years = position.experience_years or 0
        profile.education_level = position.education_level
        profile.interests = position.interests
        profile.resume_filename = position.resume_filename
        profile.resume_file_id = position.resume_file_id
        profile.preferred_formats = preferences.preferred_formats
        profile.project_theory_balance = preferences.project_theory_balance
        profile.learning_pace = preferences.learning_pace
        profile.weekly_hours = preferences.weekly_hours
        profile.preferred_language = preferences.preferred_language
        profile.budget = preferences.budget
        profile.accessibility_needs = preferences.accessibility_needs
        profile.preferred_session_minutes = preferences.preferred_session_minutes
        profile.onboarding_completed_at = profile.onboarding_completed_at or datetime.utcnow()
        profile.profile_version = (profile.profile_version or 0) + 1
        self.db.flush()

        for skill_draft in position.skills:
            skill = self._upsert_skill(profile.user_id, skill_draft)
            if skill_draft.evidence_source == "resume" and position.resume_file_id:
                self._upsert_confirmed_resume_evidence(
                    profile.user_id,
                    skill,
                    position.resume_file_id,
                    skill_draft.evidence_rationale,
                    position.resume_filename,
                    position.resume_certifications,
                    position.resume_projects,
                )

        if draft.previous_learning:
            for course in draft.previous_learning.courses:
                self._upsert_history(profile.user_id, course.model_dump())

    def _upsert_skill(self, user_id: str, skill_draft) -> Skill:
        skill = self._resolve_skill(skill_draft.name)
        learner_skill = (
            self.db.query(LearnerSkill)
            .filter(
                LearnerSkill.user_id == user_id,
                LearnerSkill.skill_id == skill.id,
            )
            .first()
        )
        if learner_skill is None:
            learner_skill = LearnerSkill(
                id=str(uuid.uuid4()), user_id=user_id, skill_id=skill.id
            )
            self.db.add(learner_skill)
        learner_skill.display_name = skill_draft.name.strip()
        learner_skill.proficiency = skill_draft.proficiency
        learner_skill.confidence = 0.55 if skill_draft.evidence_source == "resume" else 0.5
        learner_skill.source = skill_draft.evidence_source
        learner_skill.evidence_url = skill_draft.evidence_url
        return skill

    def _resolve_skill(self, name: str) -> Skill:
        canonical_name = _canonicalize_skill_name(name)
        alias = self.db.query(SkillAlias).filter(SkillAlias.alias == canonical_name).first()
        skill = alias.skill if alias else None
        if skill is None:
            skill = self.db.query(Skill).filter(Skill.canonical_name == canonical_name).first()
        if skill is None:
            skill = Skill(
                id=str(uuid.uuid4()),
                canonical_name=canonical_name,
                display_name=name.strip(),
            )
            self.db.add(skill)
            self.db.flush()
            self.db.add(
                SkillAlias(id=str(uuid.uuid4()), skill_id=skill.id, alias=canonical_name)
            )
            self.db.flush()
        return skill

    def _upsert_confirmed_resume_evidence(
        self,
        user_id: str,
        skill: Skill,
        resume_file_id: str,
        rationale: str | None,
        filename: str | None,
        certifications: list[str],
        projects: list[str],
    ) -> None:
        evidence = self.db.query(SkillEvidence).filter(
            SkillEvidence.user_id == user_id,
            SkillEvidence.skill_id == skill.id,
            SkillEvidence.source_type == "resume",
            SkillEvidence.source_id == resume_file_id,
        ).first()
        if evidence is None:
            evidence = SkillEvidence(
                id=str(uuid.uuid4()),
                user_id=user_id,
                skill_id=skill.id,
                evidence_type="learner_confirmed_resume_claim",
                source_type="resume",
                source_id=resume_file_id,
                confidence=0.55,
                weight=0.4,
            )
            self.db.add(evidence)
        evidence.rationale = rationale or "The learner confirmed this resume-derived skill during onboarding."
        evidence.evidence_metadata = {
            "filename": filename,
            "certifications": certifications,
            "projects": projects,
            "learner_confirmed": True,
        }

    def _upsert_history(self, user_id: str, course: dict) -> None:
        existing = (
            self.db.query(LearningHistory)
            .filter(
                LearningHistory.user_id == user_id,
                LearningHistory.title == course["title"],
                LearningHistory.provider == course.get("provider"),
            )
            .first()
        )
        if existing is None:
            existing = LearningHistory(id=str(uuid.uuid4()), user_id=user_id)
            self.db.add(existing)
        existing.title = course["title"]
        existing.provider = course.get("provider")
        completion_date = course.get("completion_date")
        existing.completion_date = (
            datetime.combine(completion_date, time.min) if completion_date else None
        )
        existing.topics = course.get("topics", [])
        existing.rating = course.get("rating")
        existing.evidence_url = course.get("evidence_url")
        existing.source = "onboarding"

    def _onboarding_response(
        self, session: OnboardingSession
    ) -> OnboardingSessionResponse:
        return OnboardingSessionResponse(
            session_id=session.id,
            status=session.status,
            current_step=OnboardingStep(session.current_step),
            completed_steps=[OnboardingStep(step) for step in session.completed_steps or []],
            draft=OnboardingDraft.model_validate(session.draft or {}),
            updated_at=session.updated_at,
            completed_at=session.completed_at,
        )

    def _profile_response(self, profile: UserProfile) -> LearnerProfileResponse:
        skills = [
            LearnerSkillResponse(
                id=item.id,
                name=item.display_name,
                canonical_name=item.skill.canonical_name,
                proficiency=item.proficiency,
                confidence=item.confidence,
                source=item.source,
                evidence_url=item.evidence_url,
            )
            for item in profile.learner_skills
        ]
        return LearnerProfileResponse(
            user_id=profile.user_id,
            current_role=profile.current_role,
            target_role=profile.target_role,
            objective=profile.objective,
            target_date=profile.target_date,
            experience_years=profile.experience_years or 0,
            education_level=profile.education_level,
            interests=profile.interests or [],
            preferred_formats=profile.preferred_formats or [],
            project_theory_balance=profile.project_theory_balance,
            learning_pace=profile.learning_pace,
            weekly_hours=profile.weekly_hours,
            preferred_language=profile.preferred_language,
            budget=profile.budget,
            accessibility_needs=profile.accessibility_needs or [],
            preferred_session_minutes=profile.preferred_session_minutes,
            skills=skills,
            is_onboarding_complete=profile.onboarding_completed_at is not None,
            updated_at=profile.updated_at,
        )
