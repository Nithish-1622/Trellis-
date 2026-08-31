"""Adopt or create the legacy Trellis schema.

Revision ID: 0001_legacy_baseline
Revises:
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_legacy_baseline"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create legacy tables when absent and adopt them when already present."""
    existing_tables = set(sa.inspect(op.get_bind()).get_table_names())

    if "user_profiles" not in existing_tables:
        op.create_table(
            "user_profiles",
            sa.Column("user_id", sa.String(), primary_key=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("current_role", sa.String(), nullable=True),
            sa.Column("target_role", sa.String(), nullable=True),
            sa.Column("experience_years", sa.Float(), nullable=True),
            sa.Column("education_level", sa.String(), nullable=True),
            sa.Column("resume_filename", sa.String(), nullable=True),
            sa.Column("resume_file_id", sa.String(), nullable=True),
            sa.Column("skills", sa.JSON(), nullable=True),
            sa.Column("career_goals", sa.JSON(), nullable=True),
            sa.Column("interests", sa.JSON(), nullable=True),
        )

    if "memories" not in existing_tables:
        op.create_table(
            "memories",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("memory_type", sa.String(), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("embedding", sa.JSON(), nullable=True),
            sa.Column("importance", sa.Float(), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("meta_data", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"]),
        )

    if "applications" not in existing_tables:
        op.create_table(
            "applications",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("company", sa.String(), nullable=False),
            sa.Column("position", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("applied_date", sa.DateTime(), nullable=True),
            sa.Column("last_updated", sa.DateTime(), nullable=True),
            sa.Column("url", sa.String(), nullable=True),
            sa.Column("feedback", sa.Text(), nullable=True),
            sa.Column("interview_topics", sa.JSON(), nullable=True),
            sa.Column("match_score", sa.Float(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"]),
        )

    if "roadmaps" not in existing_tables:
        op.create_table(
            "roadmaps",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("target_role", sa.String(), nullable=False),
            sa.Column("skill_gaps", sa.JSON(), nullable=True),
            sa.Column("generated_at", sa.DateTime(), nullable=True),
            sa.Column("last_updated", sa.DateTime(), nullable=True),
            sa.Column("estimated_completion_weeks", sa.Integer(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.Column("full_plan", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"]),
        )

    if "milestones" not in existing_tables:
        op.create_table(
            "milestones",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("roadmap_id", sa.String(), nullable=True),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("skills_to_learn", sa.JSON(), nullable=True),
            sa.Column("estimated_hours", sa.Integer(), nullable=True),
            sa.Column("actual_hours", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("deadline", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("resources", sa.JSON(), nullable=True),
            sa.Column("reflection", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["roadmap_id"], ["roadmaps.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"]),
        )


def downgrade() -> None:
    op.drop_table("milestones")
    op.drop_table("roadmaps")
    op.drop_table("applications")
    op.drop_table("memories")
    op.drop_table("user_profiles")
