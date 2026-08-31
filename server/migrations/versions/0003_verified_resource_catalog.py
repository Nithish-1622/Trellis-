"""Add the verified learning resource catalog.

Revision ID: 0003_verified_resource_catalog
Revises: 0002_learner_profile_domain
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003_verified_resource_catalog"
down_revision: str | None = "0002_learner_profile_domain"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "learning_resources",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("resource_type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.String(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("topics", sa.JSON(), nullable=False),
        sa.Column("prerequisites", sa.JSON(), nullable=False),
        sa.Column("cost_type", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("language", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("thumbnail_url", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(), nullable=False),
        sa.Column("verified_by", sa.String(), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("archived_at", sa.DateTime(), nullable=True),
        sa.Column("link_status", sa.String(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("provider", "external_id", name="uq_learning_resource_provider_external"),
    )
    op.create_index(
        "ix_learning_resources_catalog",
        "learning_resources",
        ["verification_status", "archived_at", "resource_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_learning_resources_catalog", table_name="learning_resources")
    op.drop_table("learning_resources")
