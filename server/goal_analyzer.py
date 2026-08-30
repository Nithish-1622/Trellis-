"""Structured goal extraction for the onboarding assistant."""

import asyncio
import logging
import re
import time
from typing import Protocol

from langchain_groq import ChatGroq

from config import settings
from profile_schemas import GoalAnalysisResponse
from telemetry import metrics


logger = logging.getLogger(__name__)


class StructuredGoalModel(Protocol):
    async def ainvoke(self, prompt: str) -> GoalAnalysisResponse: ...


class GoalAnalyzer:
    def __init__(self, model: StructuredGoalModel | None = None) -> None:
        if model is not None:
            self.model = model
        elif settings.GROQ_API_KEY:
            chat_model = ChatGroq(
                model=settings.GROQ_MODEL,
                api_key=settings.GROQ_API_KEY,
                temperature=0.1,
                timeout=8.0,
                max_retries=1,
            )
            self.model = chat_model.with_structured_output(GoalAnalysisResponse)
        else:
            self.model = None

    async def analyze(self, goal: str) -> GoalAnalysisResponse:
        if self.model is not None:
            prompt = (
                "Extract an editable learning-goal proposal from the learner's text. "
                "Do not invent credentials or experience. target_role is the concise role "
                "or capability they seek. objective is a concrete observable outcome. "
                "Set target_date only when the text contains enough timing information. "
                "Explain the extraction in one short sentence.\n\nLearner goal: "
                + goal
            )
            try:
                started = time.perf_counter()
                result = await asyncio.wait_for(self.model.ainvoke(prompt), timeout=10.0)
                metrics.observe("llm.goal_analysis", (time.perf_counter() - started) * 1000)
                return result
            except Exception as exc:
                metrics.observe("llm.goal_analysis", (time.perf_counter() - started) * 1000, failed=True)
                logger.warning("Goal analysis provider failed: %s", type(exc).__name__)

        return self._fallback(goal)

    @staticmethod
    def _fallback(goal: str) -> GoalAnalysisResponse:
        role_match = re.search(
            r"(?:become|work as|move into|transition into)\s+(?:an?\s+)?([^,.]+?)(?:\s+(?:in|within|by)\s+|[,.]|$)",
            goal,
            flags=re.IGNORECASE,
        )
        target_role = role_match.group(1).strip().title() if role_match else "Custom learning goal"
        return GoalAnalysisResponse(
            target_role=target_role,
            objective=goal.strip(),
            target_date=None,
            explanation="We created a conservative proposal from your wording; review every field before continuing.",
        )


def get_goal_analyzer() -> GoalAnalyzer:
    return GoalAnalyzer()
