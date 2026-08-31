# Architecture

## System boundaries

- React/Vite provides onboarding, roadmap actions, feedback, dashboards, and exception administration.
- Appwrite owns account sessions, short-lived JWT creation, and resume object storage.
- FastAPI validates identity, enforces ownership/roles, exposes typed `/v1` APIs, and contains modular learning/resource services.
- PostgreSQL is the source of truth for learner data, the resource index, immutable evaluations, roadmaps, interactions, and durable jobs.
- A separate worker process uses the same API image and PostgreSQL job table. It requires no Redis or additional runtime service.
- Alembic owns ordered schema migrations.

The browser sends an Appwrite JWT. FastAPI validates it against Appwrite `/account`, derives the user ID, bootstraps configured administrator roles, and uses that identity in every ownership query. Request bodies never select an owner.

## Layered resource discovery and vetting

Trellis keeps the human-reviewed internal catalog as its highest-trust source. YouTube and GitHub discover supplemental explanations, tutorials, and hands-on projects; they are discovery backends rather than the learner-facing database.

```text
Learner goal
    ↓
Versioned prerequisite-aware skill requirements
    ↓
Resource-index coverage check
    ├── enough eligible coverage → rank indexed resources
    └── coverage gap
            ↓
      YouTube / GitHub adapters
            ↓
      provider validation + canonicalization
            ↓
         DISCOVERED
            ↓
      deterministic metadata quality scoring
         ├── reject → REJECTED
         └── YouTube score ≥ 70; other score ≥ 80; confidence ≥ .45 → VETTED
            ↓
      versioned resource-skill index
            ↓
recommendations and new roadmaps
            ↓
learner interactions and reports
            ↓
aggregates, reevaluation, and admin exceptions
```

External discovery runs only for skills that lack two roadmap-eligible resources at relevance 75 or greater, including a practical item when required. Repeated discovery for the same learner profile version returns the existing durable job.

Provider candidates share a common contract. YouTube search IDs are resolved through authoritative video/channel details and rejected when private, unprocessed, non-embeddable, live, outside duration limits, language-mismatched, or spam-like. GitHub repositories must be active, non-empty, README-backed, and contain code. URLs normalize to identities such as `youtube:<video-id>` and `github:<owner>/<repo>` before uniqueness checks.

## Trellis Resource Score v3

Every automated evaluation stores its input fingerprint, provider-metadata evidence, component breakdown, final score, confidence, and `trellis-resource-score/v3` version:

- 40% semantic relevance
- 20% content quality
- 15% bounded/log-scaled engagement quality
- 15% creator or repository credibility
- 10% freshness

Freshness half-lives are eight years for stable topics, three years for moderate topics, and one year for fast-moving topics. YouTube scoring is fully deterministic and uses validated title, description, duration, publication date, engagement, and channel statistics. It performs no transcript fetch and no LLM inference.

Trust states are:

- `verified`: human-reviewed/trusted catalog content.
- `vetted`: validation-passing external content above the automatic score and confidence thresholds.
- `discovered`: valid but not yet roadmap-eligible.
- `rejected`: safety, validation, relevance, or quality failure.

Learners only see verified resources, metadata-vetted YouTube videos scoring at least 70, and other vetted resources scoring at least 80. Every automatically admitted resource must also pass the minimum confidence and relevance gates. Ranking uses `score × (0.7 + 0.3 × confidence)`, adds an eight-point verified-resource trust boost, respects language and skill relevance, limits each creator to two resources per section, favors a useful mix of formats, and retains one eligible YouTube video when available. Archived, suppressed, broken, and unsafe resources never bypass these rules, including verified ones.

## Feedback and optional human oversight

The MVP records authenticated, idempotent impressions, opens, helpful/not-helpful choices, and reports. No IP address or user-agent is stored. Raw events are retained for 90 days, while non-identifying aggregates remain. Feedback does not modify score v3. Reports enqueue reevaluation and appear in the administrator exception console.

Administrators handle exceptions rather than approving every provider result. Filters cover reports, low-confidence/high-score resources, score drops, stale content, heavily used resources, and unusual new creators. Verify, reject, pin, suppress, override, and reevaluate actions require reasons and produce audit records. Manual overrides remain separate from immutable algorithmic evaluations.

## Durable execution and provider-independent failure behavior

Workers claim jobs with PostgreSQL `FOR UPDATE SKIP LOCKED`, use bounded exponential retries, and leave exhausted jobs inspectable. A database uniqueness key prevents duplicate discovery/evaluation spend. PostgreSQL advisory locks and unique job keys coordinate scheduled cleanup and reevaluation. Fast-moving, stale, heavily used, and negatively reported resources are reevaluated at bounded rates.

Provider or worker outages never block core roadmap generation. Trellis continues from its indexed verified/vetted collection and reports unresolved coverage gaps. Existing active roadmap versions remain immutable; newly vetted resources affect new versions or learner-approved adaptations only. The roadmap's **Refresh video recommendations** action explicitly runs deterministic discovery and creates a new active version from the refreshed index.

## Learning and deployment flow

1. A learner confirms onboarding; profile/history/resume evidence and a versioned skill plan commit first.
2. Trellis idempotently starts coverage discovery. The browser polls for at most 45 seconds.
3. A roadmap is generated from currently indexed resources on success or timeout while background work may continue.
4. Quizzes, provisional project reviews, interviews, and hiring feedback add weighted skill evidence rather than overwriting proficiency.
5. Meaningful evidence can produce an immutable proposed roadmap version; only learner acceptance activates it.

The root Compose file is the production baseline. `compose.dev.yaml` adds live reload and source mounts. Production exposes the nginx client on port 8098 and FastAPI on 8088; the client proxies `/api` internally. Both Compose modes run the resource worker from the API image.
