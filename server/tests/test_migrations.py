from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_alembic_baseline_upgrades_and_downgrades_clean_database(tmp_path):
    database_path = tmp_path / "migration-test.db"
    database_url = f"sqlite:///{database_path}"
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    assert {
        "user_profiles",
        "memories",
        "applications",
        "roadmaps",
        "milestones",
        "alembic_version",
    }.issubset(inspect(engine).get_table_names())

    command.downgrade(config, "base")

    assert inspect(engine).get_table_names() == ["alembic_version"]
