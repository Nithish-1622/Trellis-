"""Bounded contextual assistant that cannot directly mutate learning plans."""

import asyncio
from datetime import datetime
import json
import logging
from typing import Protocol
import uuid

from langchain_groq import ChatGroq
from sqlalchemy.orm import Session

from auth import AuthenticatedUser
from chat_schemas import AssistantAction, AssistantDraft, ChatMessageResponse
from config import settings
from database import AssessmentAttempt, Memory, Roadmap, RoadmapMilestone, RoadmapVersion, UserProfile
from profile_service import LearnerProfileService


logger = logging.getLogger(__name__)


class StructuredAssistantModel(Protocol):
    async def ainvoke(self, prompt: str) -> AssistantDraft: ...


class LearningAssistant:
    def __init__(self, db: Session, model: StructuredAssistantModel | None = None) -> None:
        self.db = db
        self.model = model
        if self.model is None and settings.ENABLE_AI_CHAT and settings.GROQ_API_KEY:
            chat = ChatGroq(model=settings.GROQ_MODEL, api_key=settings.GROQ_API_KEY, temperature=0.2, timeout=12, max_retries=1)
            self.model = chat.with_structured_output(AssistantDraft)

    async def respond(self, identity: AuthenticatedUser, message: str) -> ChatMessageResponse:
        profile = LearnerProfileService(self.db).ensure_profile(identity)
        context = self._context(profile)
        recent = self.db.query(Memory).filter(Memory.user_id == identity.user_id, Memory.memory_type == "chat").order_by(Memory.created_at.desc()).limit(10).all()
        draft = await self._draft(message, context, list(reversed(recent)))
        draft.actions = [action for action in draft.actions if action.action_type in {"view_milestone", "open_resource", "request_adaptation", "edit_profile"}]
        self._remember(identity.user_id, "learner", message)
        self._remember(identity.user_id, "assistant", draft.message)
        self._prune(identity.user_id)
        self.db.commit()
        return ChatMessageResponse(message=draft.message, actions=draft.actions, suggestions=draft.suggestions, context={key: value for key, value in context.items() if key in {"roadmap_id", "version_number", "next_milestone_id", "evidence_count"}})

    async def _draft(self, message: str, context: dict, recent: list[Memory]) -> AssistantDraft:
        fallback = self._fallback(message, context)
        if self.model is None:
            return fallback
        history = [{"role": item.meta_data.get("role"), "content": item.content[:1000]} for item in recent]
        prompt = (
            "You are Trellis, a precise learning assistant. Use only supplied context. Explain recommendations and uncertainty. "
            "Never invent URLs. Never claim a roadmap changed. Any requested roadmap change must emit request_adaptation with requires_confirmation=true.\n"
            f"Context: {json.dumps(context, default=str)[:12000]}\nRecent conversation: {json.dumps(history)[:6000]}\nLearner: {message}"
        )
        try:
            return await asyncio.wait_for(self.model.ainvoke(prompt), timeout=14)
        except Exception as exc:
            logger.warning("Learning assistant provider failed: %s", type(exc).__name__)
            return fallback

    @staticmethod
    def _fallback(message: str, context: dict) -> AssistantDraft:
        lowered = message.casefold()
        milestone = context.get("next_milestone")
        if any(term in lowered for term in ["remove", "change", "replace", "skip", "reorder"]):
            return AssistantDraft(
                message="I can help propose that change, but I will not alter your active roadmap without your approval. First complete an assessment or provide evidence, then review the exact additions, removals, and timeline impact.",
                actions=[AssistantAction(action_type="request_adaptation", label="Review adaptation options", payload={"roadmap_id": context.get("roadmap_id")}, requires_confirmation=True)],
                suggestions=["Why is confirmation required?", "What evidence would support this change?"],
            )
        if milestone:
            resources = milestone.get("recommended_resources", [])
            resource_note = f" It includes {len(resources)} verified resource{'s' if len(resources) != 1 else ''}." if resources else " No verified catalog match is attached yet, so check the resource recommendations before starting."
            return AssistantDraft(
                message=f"Your next milestone is {milestone['title']}. {milestone.get('explanation', {}).get('why', 'It is the first unfinished milestone whose prerequisites are complete.')}{resource_note}",
                actions=[AssistantAction(action_type="view_milestone", label="Open milestone", payload={"milestone_id": milestone["id"], "roadmap_id": context.get("roadmap_id")})],
                suggestions=["Explain the prerequisites", "How should I assess this skill?"],
            )
        return AssistantDraft(
            message="Complete your learning profile and generate a roadmap so I can answer with your goals, evidence, and verified recommendations in context.",
            actions=[AssistantAction(action_type="edit_profile", label="Complete learning profile", payload={"href": "/onboarding"})],
            suggestions=["What information shapes a roadmap?"],
        )

    def _context(self, profile: UserProfile) -> dict:
        roadmap = self.db.query(Roadmap).filter(Roadmap.user_id == profile.user_id, Roadmap.is_active.is_(True)).order_by(Roadmap.generated_at.desc()).first()
        context = {
            "profile": {"target_role": profile.target_role, "objective": profile.objective, "weekly_hours": profile.weekly_hours, "interests": profile.interests or []},
            "skills": [{"name": item.display_name, "proficiency": item.proficiency, "confidence": item.confidence} for item in profile.learner_skills[:30]],
            "evidence_count": self.db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == profile.user_id).count(),
            "roadmap_id": roadmap.id if roadmap else None,
            "version_number": None,
            "next_milestone_id": None,
            "next_milestone": None,
        }
        if not roadmap:
            return context
        version = self.db.query(RoadmapVersion).filter(RoadmapVersion.roadmap_id == roadmap.id, RoadmapVersion.status == "active").first()
        if not version:
            return context
        milestones = self.db.query(RoadmapMilestone).filter(RoadmapMilestone.version_id == version.id).order_by(RoadmapMilestone.sequence).all()
        completed = {item.stable_key for item in milestones if item.status == "completed"}
        next_item = next((item for item in milestones if item.status != "completed" and all(key in completed for key in item.prerequisite_keys)), None)
        context["version_number"] = version.version_number
        if next_item:
            context["next_milestone_id"] = next_item.id
            context["next_milestone"] = {"id": next_item.id, "title": next_item.title, "target_skills": next_item.target_skills, "prerequisite_keys": next_item.prerequisite_keys, "recommended_resources": next_item.recommended_resources, "explanation": next_item.explanation}
        return context

    def _remember(self, user_id: str, role: str, content: str) -> None:
        self.db.add(Memory(id=str(uuid.uuid4()), user_id=user_id, created_at=datetime.utcnow(), memory_type="chat", content=content, importance=0.3, tags=["assistant"], meta_data={"role": role}))

    def _prune(self, user_id: str) -> None:
        stale = self.db.query(Memory).filter(Memory.user_id == user_id, Memory.memory_type == "chat").order_by(Memory.created_at.desc()).offset(50).all()
        for memory in stale:
            self.db.delete(memory)


def get_learning_assistant(db: Session) -> LearningAssistant:
    return LearningAssistant(db)
