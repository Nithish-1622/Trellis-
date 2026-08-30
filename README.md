# Trellis

Trellis is a pilot-ready personalized learning platform. Learners describe a goal, confirm a structured profile, import prior learning, and receive an evidence-driven roadmap made from verified catalog resources and validated live provider results.

## What is included

- Resumable hybrid onboarding with natural-language goal analysis and explicit review.
- Normalized learner profiles, skills, history, assessments, and weighted evidence.
- Prerequisite-aware, scheduled, versioned learning roadmaps.
- Verified course catalog plus live YouTube and GitHub supplemental resources.
- Progress, milestones, deterministic quizzes, provisional project rubrics, and dashboard insights.
- Learner-approved roadmap adaptation that preserves completed work and prior versions.
- Contextual assistant actions that cannot silently mutate a roadmap.
- Persistent interview practice and lower-weight hiring-process evidence.
- Administrator catalog review, bulk import, provider sync, link checks, and safe metrics.

Appwrite owns identity and resume object storage. PostgreSQL and Alembic own application data.

## Run from the repository root

Copy configuration templates first:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set the same Appwrite project in `server/.env` and `client/.env`. Configure `ADMIN_USER_IDS` with comma-separated Appwrite user IDs. External provider and LLM keys are optional; verified catalog content and deterministic fallbacks remain available without them.

Development with live reload:

```bash
make dev
```

- Client: http://localhost:5173
- API: http://localhost:8085
- API docs: http://localhost:8085/docs

Production-style local deployment:

```bash
make prod
```

- Client: http://localhost:8098
- API: http://localhost:8088
- The client proxies `/api/*` to the internal API container.

Use `make help` for logs, status, builds, migrations, tests, and teardown commands. `make destroy` and `make dev-destroy` remove the PostgreSQL volume and are intentionally destructive.

## Quality gates

```bash
make config
make test
make lint
make e2e
```

The API container applies Alembic migrations during startup. They can also be run explicitly with `make migrate` and inspected with `make migration-current`.

## API conventions

All product endpoints are under `/v1`. Except for health endpoints, requests use a short-lived Appwrite JWT:

```http
Authorization: Bearer <appwrite-jwt>
```

Ownership is derived from that token and never accepted from a request body. Errors use one envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

Primary endpoint groups:

- `/v1/me/*` — onboarding, profile, history, resume evidence, skills, dashboard.
- `/v1/roadmaps/*` — generation, versions, milestone progress, assessments, adaptations.
- `/v1/resources/recommendations` — ranked verified and live supplemental resources.
- `/v1/chat/messages` — contextual learner assistant.
- `/v1/career/*` — real job links, applications, and persistent interview evidence.
- `/v1/admin/resources/*` — administrator catalog workflow.
- `/v1/admin/operations/metrics` — content-free pilot aggregates.

Legacy unversioned agent endpoints have been removed.

## Operational notes

- `PILOT_FEATURE_ENABLED=false` hides product routes while leaving health checks available.
- `/health/ready` verifies database connectivity and is used by Docker health checks.
- Provider and AI operations have bounded timeouts, retries, user-scoped rate limits, and deterministic/catalog fallbacks.
- Operational metrics contain counts and latency aggregates only; learner prompts and answers are not recorded.
- Live resources are validated provider responses. AI can rank and explain them but cannot invent URLs.

Architecture and test details are in [server/docs/ARCHITECTURE.md](server/docs/ARCHITECTURE.md) and [server/docs/TESTING.md](server/docs/TESTING.md).
