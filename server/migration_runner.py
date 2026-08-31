"""Application migration entry point."""

from pathlib import Path

from alembic import command
from alembic.config import Config


def run_migrations() -> None:
    """Upgrade the configured application database to the latest revision."""
    root = Path(__file__).resolve().parent
    config = Config(str(root / "alembic.ini"))
    command.upgrade(config, "head")
