"""Harden automated resource evaluation idempotency.

Revision ID: 0006_vetting_hardening
Revises: 0005_resource_vetting
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0006_vetting_hardening"
down_revision: str | None = "0005_resource_vetting"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("""
        DELETE FROM resource_evaluations
        WHERE id IN (
            SELECT duplicate.id
            FROM resource_evaluations AS duplicate
            JOIN resource_evaluations AS retained
              ON retained.resource_id = duplicate.resource_id
             AND retained.input_fingerprint = duplicate.input_fingerprint
             AND retained.id < duplicate.id
        )
    """))
    with op.batch_alter_table("resource_evaluations") as batch:
        batch.create_unique_constraint(
            "uq_resource_evaluation_fingerprint", ["resource_id", "input_fingerprint"],
        )


def downgrade() -> None:
    with op.batch_alter_table("resource_evaluations") as batch:
        batch.drop_constraint("uq_resource_evaluation_fingerprint", type_="unique")
