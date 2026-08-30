"""Add the automated resource vetting index.

Revision ID: 0005_resource_vetting
Revises: 0004_learning_domain
"""

from collections.abc import Sequence
from urllib.parse import urlsplit

from alembic import op
import sqlalchemy as sa


revision: str = "0005_resource_vetting"
down_revision: str | None = "0004_learning_domain"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _canonical_key(provider: str, external_id: str | None, url: str, resource_id: str) -> str:
    source = provider.casefold().strip()
    parsed = urlsplit(url)
    if source == "youtube":
        video_id = external_id
        if not video_id and parsed.hostname in {"youtu.be", "www.youtu.be"}:
            video_id = parsed.path.strip("/").split("/")[0]
        if video_id:
            return f"youtube:{video_id}"
    if source == "github" and parsed.hostname in {"github.com", "www.github.com"}:
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 2:
            return f"github:{parts[0].casefold()}/{parts[1].removesuffix('.git').casefold()}"
    identity = external_id or resource_id
    return f"{source}:{identity}"


def upgrade() -> None:
    with op.batch_alter_table("learning_resources") as batch:
        batch.add_column(sa.Column("canonical_key", sa.String(), nullable=True))
        batch.add_column(sa.Column("duration_seconds", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("author", sa.String(), nullable=True))
        batch.add_column(sa.Column("published_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("resource_score", sa.Float(), nullable=True))
        batch.add_column(sa.Column("score_confidence", sa.Float(), nullable=True))
        batch.add_column(sa.Column("score_version", sa.String(), nullable=True))
        batch.add_column(sa.Column("freshness_class", sa.String(), nullable=False, server_default="moderate"))
        batch.add_column(sa.Column("last_evaluated_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("score_override", sa.Float(), nullable=True))
        batch.add_column(sa.Column("override_reason", sa.Text(), nullable=True))
        batch.add_column(sa.Column("suppressed_at", sa.DateTime(), nullable=True))

    connection = op.get_bind()
    resources = connection.execute(sa.text(
        "SELECT id, provider, external_id, url FROM learning_resources ORDER BY id"
    )).mappings()
    canonical_keys: set[str] = set()
    for resource in resources:
        canonical_key = _canonical_key(resource["provider"], resource["external_id"], resource["url"], resource["id"])
        duplicate = canonical_key in canonical_keys
        canonical_keys.add(canonical_key)
        if duplicate:
            canonical_key = f"{canonical_key}:legacy-duplicate:{resource['id']}"
        connection.execute(
            sa.text("""
                UPDATE learning_resources
                SET canonical_key=:canonical_key,
                    archived_at=CASE WHEN :duplicate THEN COALESCE(archived_at, CURRENT_TIMESTAMP) ELSE archived_at END
                WHERE id=:id
            """),
            {"id": resource["id"], "canonical_key": canonical_key, "duplicate": duplicate},
        )
    connection.execute(sa.text(
        "UPDATE learning_resources SET verification_status='discovered' WHERE verification_status='pending'"
    ))
    with op.batch_alter_table("learning_resources") as batch:
        batch.create_unique_constraint("uq_learning_resource_canonical_key", ["canonical_key"])

    op.create_table(
        "learner_goal_skills",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("profile_version", sa.Integer(), nullable=False),
        sa.Column("target_level", sa.String(), nullable=False),
        sa.Column("importance", sa.Float(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("prerequisite_skill_ids", sa.JSON(), nullable=False),
        sa.Column("resource_intent", sa.String(), nullable=False),
        sa.Column("analyzer_version", sa.String(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "profile_version", "skill_id", name="uq_goal_skill_profile_version"),
    )
    op.create_index("ix_goal_skills_user_version", "learner_goal_skills", ["user_id", "profile_version"])

    op.create_table(
        "resource_skill_map",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("resource_id", sa.String(), nullable=False),
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("resource_id", "skill_id", name="uq_resource_skill"),
    )
    op.create_index("ix_resource_skill_lookup", "resource_skill_map", ["skill_id", "relevance_score"])

    op.create_table(
        "resource_evaluations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("resource_id", sa.String(), nullable=False),
        sa.Column("evaluation_version", sa.String(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.Column("content_quality_score", sa.Float(), nullable=False),
        sa.Column("engagement_score", sa.Float(), nullable=False),
        sa.Column("creator_score", sa.Float(), nullable=False),
        sa.Column("freshness_score", sa.Float(), nullable=False),
        sa.Column("final_score", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(), nullable=True),
        sa.Column("input_fingerprint", sa.String(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("evaluated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_resource_evaluations_resource_time", "resource_evaluations", ["resource_id", "evaluated_at"])

    op.create_table(
        "resource_jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("job_type", sa.String(), nullable=False),
        sa.Column("dedupe_key", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("run_at", sa.DateTime(), nullable=False),
        sa.Column("locked_at", sa.DateTime(), nullable=True),
        sa.Column("locked_by", sa.String(), nullable=True),
        sa.Column("last_error_code", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
        sa.UniqueConstraint("job_type", "dedupe_key", name="uq_resource_job_dedupe"),
    )
    op.create_index("ix_resource_jobs_claim", "resource_jobs", ["status", "run_at", "created_at"])
    op.create_index("ix_resource_jobs_user", "resource_jobs", ["user_id", "created_at"])

    op.create_table(
        "roadmap_resource_assignments",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("milestone_id", sa.String(), nullable=False),
        sa.Column("resource_id", sa.String(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("score_at_assignment", sa.Float(), nullable=True),
        sa.Column("confidence_at_assignment", sa.Float(), nullable=True),
        sa.Column("score_version", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["milestone_id"], ["roadmap_milestones.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("milestone_id", "resource_id", name="uq_milestone_resource_assignment"),
    )
    op.create_index("ix_resource_assignments_resource", "roadmap_resource_assignments", ["resource_id"])

    op.create_table(
        "resource_interactions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("resource_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("milestone_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("idempotency_key", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["milestone_id"], ["roadmap_milestones.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("user_id", "idempotency_key", name="uq_resource_interaction_idempotency"),
    )
    op.create_index("ix_resource_interactions_resource_time", "resource_interactions", ["resource_id", "created_at"])

    op.create_table(
        "resource_signal_summaries",
        sa.Column("resource_id", sa.String(), primary_key=True),
        sa.Column("impressions", sa.Integer(), nullable=False),
        sa.Column("opens", sa.Integer(), nullable=False),
        sa.Column("helpful", sa.Integer(), nullable=False),
        sa.Column("not_helpful", sa.Integer(), nullable=False),
        sa.Column("reports", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "resource_moderation_actions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("resource_id", sa.String(), nullable=False),
        sa.Column("admin_user_id", sa.String(), nullable=False),
        sa.Column("action_type", sa.String(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("previous_value", sa.JSON(), nullable=False),
        sa.Column("new_value", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["learning_resources.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_resource_moderation_resource_time", "resource_moderation_actions", ["resource_id", "created_at"])


def downgrade() -> None:
    op.get_bind().execute(sa.text(
        "UPDATE learning_resources SET verification_status='pending' WHERE verification_status IN ('discovered', 'vetted', 'rejected')"
    ))
    op.drop_index("ix_resource_moderation_resource_time", table_name="resource_moderation_actions")
    op.drop_table("resource_moderation_actions")
    op.drop_table("resource_signal_summaries")
    op.drop_index("ix_resource_interactions_resource_time", table_name="resource_interactions")
    op.drop_table("resource_interactions")
    op.drop_index("ix_resource_assignments_resource", table_name="roadmap_resource_assignments")
    op.drop_table("roadmap_resource_assignments")
    op.drop_index("ix_resource_jobs_user", table_name="resource_jobs")
    op.drop_index("ix_resource_jobs_claim", table_name="resource_jobs")
    op.drop_table("resource_jobs")
    op.drop_index("ix_resource_evaluations_resource_time", table_name="resource_evaluations")
    op.drop_table("resource_evaluations")
    op.drop_index("ix_resource_skill_lookup", table_name="resource_skill_map")
    op.drop_table("resource_skill_map")
    op.drop_index("ix_goal_skills_user_version", table_name="learner_goal_skills")
    op.drop_table("learner_goal_skills")
    with op.batch_alter_table("learning_resources") as batch:
        batch.drop_constraint("uq_learning_resource_canonical_key", type_="unique")
    with op.batch_alter_table("learning_resources") as batch:
        for column in (
            "suppressed_at", "override_reason", "score_override", "is_pinned", "last_evaluated_at",
            "freshness_class", "score_version", "score_confidence", "resource_score", "published_at",
            "author", "duration_seconds", "canonical_key",
        ):
            batch.drop_column(column)
