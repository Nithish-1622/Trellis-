from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text


def test_alembic_revision_ids_fit_version_table_column():
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    revisions = ScriptDirectory.from_config(config).walk_revisions()
    oversized_revisions = {
        revision.revision: len(revision.revision)
        for revision in revisions
        if len(revision.revision) > 32
    }

    assert oversized_revisions == {}


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
        "app_users",
        "user_roles",
        "onboarding_sessions",
        "skills",
        "skill_aliases",
        "learner_skills",
        "learning_history",
        "skill_evidence",
        "learning_resources",
        "roadmap_versions",
        "roadmap_milestones",
        "learning_activities",
        "assessment_attempts",
        "adaptation_proposals",
        "interview_evidence_sessions",
        "learner_goal_skills",
        "resource_skill_map",
        "resource_evaluations",
        "resource_jobs",
        "roadmap_resource_assignments",
        "resource_interactions",
        "resource_signal_summaries",
        "resource_moderation_actions",
        "alembic_version",
    }.issubset(inspect(engine).get_table_names())

    command.downgrade(config, "base")

    assert inspect(engine).get_table_names() == ["alembic_version"]


def test_resource_vetting_migration_backfills_pending_resources(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'resource-backfill.db'}"
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "0004_learning_domain")

    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(text("""
            INSERT INTO learning_resources (
                id, provider, external_id, resource_type, title, description, level,
                duration_minutes, topics, prerequisites, cost_type, price, currency,
                language, url, thumbnail_url, verification_status, verified_by,
                verified_at, archived_at, link_status, metadata, created_at, updated_at
            ) VALUES (
                'legacy-video', 'youtube', 'abc123', 'video', 'Legacy video', NULL, NULL,
                30, '[]', '[]', 'free', NULL, NULL, 'English',
                'https://youtu.be/abc123', NULL, 'pending', NULL, NULL, NULL,
                'healthy', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        """))

    command.upgrade(config, "head")

    with engine.connect() as connection:
        row = connection.execute(text(
            "SELECT verification_status, canonical_key FROM learning_resources WHERE id='legacy-video'"
        )).one()
    assert row.verification_status == "discovered"
    assert row.canonical_key == "youtube:abc123"

    command.downgrade(config, "0004_learning_domain")
    with engine.connect() as connection:
        status = connection.execute(text(
            "SELECT verification_status FROM learning_resources WHERE id='legacy-video'"
        )).scalar_one()
    assert status == "pending"


def test_resource_vetting_migration_quarantines_canonical_collisions(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'resource-collision.db'}"
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "0004_learning_domain")
    engine = create_engine(database_url)
    insert = text("""
        INSERT INTO learning_resources (
            id, provider, external_id, resource_type, title, duration_minutes, topics, prerequisites,
            cost_type, language, url, verification_status, link_status, metadata, created_at, updated_at
        ) VALUES (
            :id, 'github', :external_id, 'project', :id, 30, '[]', '[]', 'free', 'English',
            :url, 'pending', 'healthy', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
    """)
    with engine.begin() as connection:
        connection.execute(insert, {"id": "a", "external_id": "legacy-a", "url": "https://github.com/Example/Project"})
        connection.execute(insert, {"id": "b", "external_id": "legacy-b", "url": "https://github.com/example/project.git"})

    command.upgrade(config, "head")

    with engine.connect() as connection:
        rows = connection.execute(text(
            "SELECT canonical_key, archived_at FROM learning_resources ORDER BY id"
        )).all()
    assert rows[0].canonical_key == "github:example/project"
    assert rows[0].archived_at is None
    assert rows[1].canonical_key.startswith("github:example/project:legacy-duplicate:")
    assert rows[1].archived_at is not None
