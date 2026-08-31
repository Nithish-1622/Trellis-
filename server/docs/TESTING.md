# Testing and release gates

From the repository root:

```bash
make config
make test
make lint
make e2e
```

Backend coverage includes authentication, cross-user ownership, onboarding drafts and completion, history import, resume evidence, catalog authorization and provider fallback, roadmap generation, milestone progress, assessment weighting, adaptation versions, dashboard aggregation, chat actions, career evidence, rate limiting, feature gating, and migration topology.

Frontend coverage includes onboarding steps and persistence, CSV preview, roadmap assessments and adaptation review, dashboard explanations, contextual chat actions, and administrator catalog controls. Playwright covers browser behavior, responsive onboarding, and keyboard focus.

Before a pilot deployment also run:

```bash
npm --prefix client audit --audit-level=high
docker compose build
make migrate
make migration-current
```

Rehearse backup and restore with the deployment environment's PostgreSQL tooling before applying migrations to irreplaceable data. Never use the destructive Makefile targets as a backup strategy.
