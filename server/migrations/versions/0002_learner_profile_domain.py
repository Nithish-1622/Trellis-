"""Add normalized learner profile, skill, history, and evidence models.

Revision ID: 0002_learner_profile_domain
Revises: 0001_legacy_baseline
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_learner_profile_domain"
down_revision: str | None = "0001_legacy_baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


PROFILE_COLUMNS = (
    sa.Column("objective", sa.Text(), nullable=True),
    sa.Column("target_date", sa.DateTime(), nullable=True),
    sa.Column("preferred_formats", sa.JSON(), nullable=True),
    sa.Column("project_theory_balance", sa.Integer(), nullable=True),
    sa.Column("learning_pace", sa.String(), nullable=True),
    sa.Column("weekly_hours", sa.Float(), nullable=True),
    sa.Column("preferred_language", sa.String(), nullable=True),
    sa.Column("budget", sa.String(), nullable=True),
    sa.Column("accessibility_needs", sa.JSON(), nullable=True),
    sa.Column("preferred_session_minutes", sa.Integer(), nullable=True),
    sa.Column("onboarding_completed_at", sa.DateTime(), nullable=True),
    sa.Column("profile_version", sa.Integer(), nullable=False, server_default="1"),
)


def upgrade() -> None:
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("user_profiles")
    }
    for column in PROFILE_COLUMNS:
        if column.name not in existing_columns:
            op.add_column("user_profiles", column)

    op.create_table(
        "app_users",
        sa.Column("user_id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["app_users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "role"),
    )
    op.create_table(
        "onboarding_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, unique=True),
        sa.Column("current_step", sa.String(), nullable=False),
        sa.Column("completed_steps", sa.JSON(), nullable=False),
        sa.Column("draft", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["app_users.user_id"], ondelete="CASCADE"),
    )
    op.create_table(
        "skills",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("canonical_name", sa.String(), nullable=False, unique=True),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "skill_aliases",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("alias", sa.String(), nullable=False, unique=True),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
    )
    op.create_table(
        "learner_skills",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=False),
        sa.Column("proficiency", sa.String(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("evidence_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "skill_id", name="uq_learner_skill_user_skill"),
    )
    op.create_index("ix_learner_skills_user_id", "learner_skills", ["user_id"])
    op.create_table(
        "learning_history",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("resource_url", sa.String(), nullable=True),
        sa.Column("completion_date", sa.DateTime(), nullable=True),
        sa.Column("topics", sa.JSON(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("evidence_url", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
    )
    op.create_index("ix_learning_history_user_id", "learning_history", ["user_id"])
    op.create_table(
        "skill_evidence",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("skill_id", sa.String(), nullable=False),
        sa.Column("evidence_type", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("observed_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_skill_evidence_user_skill", "skill_evidence", ["user_id", "skill_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_skill_evidence_user_skill", table_name="skill_evidence")
    op.drop_table("skill_evidence")
    op.drop_index("ix_learning_history_user_id", table_name="learning_history")
    op.drop_table("learning_history")
    op.drop_index("ix_learner_skills_user_id", table_name="learner_skills")
    op.drop_table("learner_skills")
    op.drop_table("skill_aliases")
    op.drop_table("skills")
    op.drop_table("onboarding_sessions")
    op.drop_table("user_roles")
    op.drop_table("app_users")

    for column in reversed(PROFILE_COLUMNS):
        op.drop_column("user_profiles", column.name)
