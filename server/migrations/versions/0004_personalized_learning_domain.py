"""Add versioned roadmaps, progress, assessment, adaptation, and interview evidence.

Revision ID: 0004_personalized_learning_domain
Revises: 0003_verified_resource_catalog
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004_personalized_learning_domain"
down_revision: str | None = "0003_verified_resource_catalog"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table("roadmap_versions", sa.Column("id", sa.String(), primary_key=True), sa.Column("roadmap_id", sa.String(), nullable=False), sa.Column("version_number", sa.Integer(), nullable=False), sa.Column("status", sa.String(), nullable=False), sa.Column("rationale", sa.Text(), nullable=True), sa.Column("change_summary", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("activated_at", sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(["roadmap_id"], ["roadmaps.id"], ondelete="CASCADE"), sa.UniqueConstraint("roadmap_id", "version_number", name="uq_roadmap_version_number"))
    op.create_index("ix_roadmap_versions_roadmap_status", "roadmap_versions", ["roadmap_id", "status"])
    op.create_table("roadmap_milestones", sa.Column("id", sa.String(), primary_key=True), sa.Column("version_id", sa.String(), nullable=False), sa.Column("stable_key", sa.String(), nullable=False), sa.Column("title", sa.String(), nullable=False), sa.Column("description", sa.Text(), nullable=True), sa.Column("sequence", sa.Integer(), nullable=False), sa.Column("prerequisite_keys", sa.JSON(), nullable=False), sa.Column("target_skills", sa.JSON(), nullable=False), sa.Column("estimated_hours", sa.Float(), nullable=False), sa.Column("scheduled_start", sa.DateTime(), nullable=True), sa.Column("deadline", sa.DateTime(), nullable=True), sa.Column("status", sa.String(), nullable=False), sa.Column("progress_percentage", sa.Integer(), nullable=False), sa.Column("recommended_resources", sa.JSON(), nullable=False), sa.Column("assessment_config", sa.JSON(), nullable=False), sa.Column("explanation", sa.JSON(), nullable=False), sa.Column("reflection", sa.Text(), nullable=True), sa.Column("completed_at", sa.DateTime(), nullable=True), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.ForeignKeyConstraint(["version_id"], ["roadmap_versions.id"], ondelete="CASCADE"), sa.UniqueConstraint("version_id", "stable_key", name="uq_roadmap_milestone_version_key"))
    op.create_index("ix_roadmap_milestones_version_sequence", "roadmap_milestones", ["version_id", "sequence"])
    op.create_table("learning_activities", sa.Column("id", sa.String(), primary_key=True), sa.Column("user_id", sa.String(), nullable=False), sa.Column("milestone_id", sa.String(), nullable=False), sa.Column("resource_id", sa.String(), nullable=True), sa.Column("resource_url", sa.String(), nullable=False), sa.Column("resource_title", sa.String(), nullable=False), sa.Column("status", sa.String(), nullable=False), sa.Column("progress_percentage", sa.Integer(), nullable=False), sa.Column("time_spent_minutes", sa.Integer(), nullable=False), sa.Column("usefulness_rating", sa.Integer(), nullable=True), sa.Column("difficulty_rating", sa.Integer(), nullable=True), sa.Column("started_at", sa.DateTime(), nullable=True), sa.Column("completed_at", sa.DateTime(), nullable=True), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.ForeignKeyConstraint(["milestone_id"], ["roadmap_milestones.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"))
    op.create_index("ix_learning_activities_user_milestone", "learning_activities", ["user_id", "milestone_id"])
    op.create_table("assessment_attempts", sa.Column("id", sa.String(), primary_key=True), sa.Column("user_id", sa.String(), nullable=False), sa.Column("milestone_id", sa.String(), nullable=False), sa.Column("assessment_type", sa.String(), nullable=False), sa.Column("questions", sa.JSON(), nullable=False), sa.Column("answers", sa.JSON(), nullable=False), sa.Column("rubric", sa.JSON(), nullable=False), sa.Column("score", sa.Float(), nullable=False), sa.Column("rationale", sa.Text(), nullable=True), sa.Column("confidence", sa.Float(), nullable=False), sa.Column("provisional", sa.Boolean(), nullable=False), sa.Column("reflection", sa.Text(), nullable=True), sa.Column("created_at", sa.DateTime(), nullable=False), sa.ForeignKeyConstraint(["milestone_id"], ["roadmap_milestones.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"))
    op.create_index("ix_assessment_attempts_user_milestone", "assessment_attempts", ["user_id", "milestone_id"])
    op.create_table("adaptation_proposals", sa.Column("id", sa.String(), primary_key=True), sa.Column("user_id", sa.String(), nullable=False), sa.Column("roadmap_id", sa.String(), nullable=False), sa.Column("base_version_id", sa.String(), nullable=False), sa.Column("proposed_version_id", sa.String(), nullable=False), sa.Column("status", sa.String(), nullable=False), sa.Column("diff", sa.JSON(), nullable=False), sa.Column("evidence_ids", sa.JSON(), nullable=False), sa.Column("feedback", sa.Text(), nullable=True), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("decided_at", sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(["base_version_id"], ["roadmap_versions.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["proposed_version_id"], ["roadmap_versions.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["roadmap_id"], ["roadmaps.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"))
    op.create_index("ix_adaptation_proposals_user_status", "adaptation_proposals", ["user_id", "status"])
    op.create_table("interview_evidence_sessions", sa.Column("id", sa.String(), primary_key=True), sa.Column("user_id", sa.String(), nullable=False), sa.Column("target_role", sa.String(), nullable=False), sa.Column("status", sa.String(), nullable=False), sa.Column("transcript", sa.JSON(), nullable=False), sa.Column("topic_scores", sa.JSON(), nullable=False), sa.Column("overall_score", sa.Float(), nullable=True), sa.Column("evidence_ids", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("completed_at", sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"))
    op.create_index("ix_interview_evidence_sessions_user", "interview_evidence_sessions", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_interview_evidence_sessions_user", table_name="interview_evidence_sessions")
    op.drop_table("interview_evidence_sessions")
    op.drop_index("ix_adaptation_proposals_user_status", table_name="adaptation_proposals")
    op.drop_table("adaptation_proposals")
    op.drop_index("ix_assessment_attempts_user_milestone", table_name="assessment_attempts")
    op.drop_table("assessment_attempts")
    op.drop_index("ix_learning_activities_user_milestone", table_name="learning_activities")
    op.drop_table("learning_activities")
    op.drop_index("ix_roadmap_milestones_version_sequence", table_name="roadmap_milestones")
    op.drop_table("roadmap_milestones")
    op.drop_index("ix_roadmap_versions_roadmap_status", table_name="roadmap_versions")
    op.drop_table("roadmap_versions")
