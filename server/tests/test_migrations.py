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
