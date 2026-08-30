# Architecture

## Boundaries

- React/Vite client: onboarding, learning dashboard, roadmap actions, assistant, practice, jobs, and catalog administration.
- Appwrite: account sessions, short-lived JWT creation, and resume object storage.
- FastAPI: authentication, authorization, typed `/v1` contracts, domain services, provider adapters, and structured errors.
- PostgreSQL: learner profiles, normalized skills, history, resources, roadmaps, activities, assessments, evidence, adaptations, and interview sessions.
- Alembic: adoptive, ordered database migrations.

The browser sends an Appwrite JWT. FastAPI validates it against Appwrite `/account`, derives the user ID, bootstraps configured administrator roles, and uses that identity in every ownership query. Request bodies do not select an owner.

## Learning pipeline

1. A learner confirms the hybrid onboarding draft.
2. Profile, history, and skill evidence are persisted before generation.
3. A deterministic role path resolves aliases, removes demonstrated skills, orders prerequisites, and schedules work from weekly availability.
4. Only verified catalog URLs or validated provider results can appear as resources.
5. Quizzes, provisional projects, interviews, and hiring feedback add weighted evidence; they do not directly overwrite proficiency.
6. Meaningful evidence can produce an immutable proposed roadmap version.
7. Accepting a proposal atomically activates it; rejection preserves the active version.

## Failure and safety model

- Provider and LLM calls have timeouts, bounded retries, caching where appropriate, and deterministic/catalog fallbacks.
- Expensive operations are rate-limited per authenticated user and operation.
- Resume uploads enforce type and size limits before parsing.
- External resource URLs are validated; catalog verification and archive actions require server-side administrator authorization.
- Chat changes are typed actions, and roadmap mutations require learner confirmation.
- Metrics record route/provider/LLM counts, failure counts, and aggregate latency without learner content.

## Deployment

The root Compose file is the production-style baseline. `compose.dev.yaml` overrides targets, mounts source code, and exposes the development ports. The production client is static nginx content and proxies `/api` to `api:8000`. The API runs as a non-root user and reports readiness only after PostgreSQL responds.
