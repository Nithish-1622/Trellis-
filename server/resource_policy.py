"""Shared learner-visibility rules for indexed resources."""

from sqlalchemy import and_, or_

from config import settings
from database import LearningResource


INELIGIBLE_LINK_STATUSES = ("broken", "unsafe", "unhealthy", "unreachable", "blocked", "invalid")


def automatic_score_threshold(provider: str) -> float:
    if provider.casefold() == "youtube":
        return settings.YOUTUBE_METADATA_ELIGIBLE_SCORE_THRESHOLD
    return settings.RESOURCE_VETTED_SCORE_THRESHOLD


def learner_eligible_resource_condition():
    """Return the single SQL admission rule used by every learner-facing path."""
    return or_(
        LearningResource.verification_status == "verified",
        and_(
            LearningResource.verification_status == "vetted",
            LearningResource.score_confidence >= settings.RESOURCE_MIN_CONFIDENCE,
            or_(
                and_(
                    LearningResource.provider == "youtube",
                    LearningResource.resource_score >= settings.YOUTUBE_METADATA_ELIGIBLE_SCORE_THRESHOLD,
                ),
                and_(
                    LearningResource.provider != "youtube",
                    LearningResource.resource_score >= settings.RESOURCE_VETTED_SCORE_THRESHOLD,
                ),
            ),
        ),
    )
