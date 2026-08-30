import pytest

from goal_analyzer import GoalAnalyzer


class FailingGoalModel:
    async def ainvoke(self, _prompt: str):
        raise TimeoutError("provider timeout")


@pytest.mark.asyncio
async def test_goal_analyzer_falls_back_without_losing_learner_wording():
    analyzer = GoalAnalyzer(model=FailingGoalModel())

    result = await analyzer.analyze(
        "I want to become a backend engineer within twelve months."
    )

    assert result.target_role == "Backend Engineer"
    assert result.objective == "I want to become a backend engineer within twelve months."
    assert "review" in result.explanation.lower()
