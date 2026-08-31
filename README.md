# Trellis 🌿

**AI-Powered Personalized Learning Path Recommender**

Trellis is an enterprise-grade, pilot-ready personalized learning platform designed to bridge the gap between open-ended career ambitions and actionable, verified skill acquisition. Unlike traditional learning management systems or generic course marketplaces that present static, unranked course lists, Trellis acts as a **prerequisite-aware, evidence-driven AI learning coach**.

By combining natural language goal decomposition, multi-modal resume ingestion, automated resource discovery and vetting (YouTube & GitHub), topological dependency graph scheduling, and continuous evidence-based skill evaluation, Trellis guarantees transparent, reliable, and dynamically adaptive learning roadmaps with zero hallucinated resource URLs.

---

## 📐 System Architecture & Data Flow

Trellis operates on a decoupled microservices architecture with a React (TypeScript) SPA frontend, a FastAPI (Python 3.11+) backend, a PostgreSQL 17 + `pgvector` database engine, Appwrite authentication/storage services, and an autonomous asynchronous background worker for resource vetting.

```text
                                +---------------------------------------+
                                |  Learner Goal (Natural Language)      |
                                |  + PDF Resume / Prior History         |
                                +-------------------+-------------------+
                                                    |
                                                    v
                                +---------------------------------------+
                                |      Learner Profiling Engine         |
                                |  - Goal & Intent Decomposition        |
                                |  - Skill Tree Extraction              |
                                |  - Initial Weighted Evidence Scorer   |
                                +-------------------+-------------------+
                                                    |
                                                    v
                                +---------------------------------------+
                                |     Skill Taxonomy & Alias Resolver   |
                                |  (Canonicalization via Vector DB)     |
                                +-------------------+-------------------+
                                                    |
                                                    v
                                +---------------------------------------+
                                |     Layered Resource Vetting Engine   |
                                |  - Internal Verified Catalog          |
                                |  - YouTube & GitHub Adapters          |
                                |  - Groq Transcript Analysis           |
                                |  - Trellis Resource Score v1 Engine   |
                                +-------------------+-------------------+
                                                    |
                                                    v
                                +---------------------------------------+
                                | Topological Prerequisite Roadmap Engine|
                                |  - Dependency Graph DAG Builder       |
                                |  - Pace & Weekly Hour Scheduler       |
                                |  - Immutable Version Snapshot (v1)    |
                                +-------------------+-------------------+
                                                    |
         +------------------------------------------+------------------------------------------+
         |                                          |                                          |
         v                                          v                                          v
+------------------+                      +-------------------+                      +-------------------+
|  Interactive AI  |                      | Diagnostic Quiz   |                      | Learner-Approved  |
| Learning Assistant|                      | & Project Rubrics |                      | Roadmap Adaptation|
+------------------+                      +-------------------+                      +-------------------+
```

---

## ✨ Creative & Technical Innovations

### 🧠 1. Evidence-Weighted Learner Skill Profiling
- **Probabilistic Skill Estimation**: Rather than relying on simple self-reported checkboxes or binary pass/fail flags, Trellis calculates learner proficiency via a weighted evidence pipeline (`SkillEvidence` tuples: `(evidence_type, source_type, score, confidence, weight)`).
- **Multi-Source Evidence Convergence**:
  - *Resume Ingestion*: Uploaded PDF resumes are parsed into structured skill trees with initial proficiency estimates and moderate weight ($0.6$).
  - *Self-Reported History*: Prior course completions provide foundational evidence ($0.5$).
  - *Diagnostic Quizzes*: Multiple-choice comprehension tests adjust confidence dynamically ($0.8$).
  - *Provisional Project Rubrics*: Milestone project submissions evaluated against multi-criterion rubrics yield high-weight skill evidence ($1.0$).
  - *Mock Technical Interviews*: Simulated interviews provide contextual performance observations ($0.7$).
- **Resumable Hybrid Onboarding**: Learner onboarding state is persisted in `OnboardingSession` drafts in PostgreSQL, enabling multi-session profile setup without data loss.

---

### 🔍 2. Layered Resource Vetting & Anti-Hallucination Indexing
- **Zero URL Invention Guarantee**: Traditional LLM wrappers frequently hallucinate dead or non-existent course URLs. Trellis completely solves this: the LLM roadmap engine **never generates URLs**. It operates strictly over indexed, canonical database resource identifiers (`youtube:<id>`, `github:<owner>/<repo>`, `catalog:<id>`) that have passed strict validation.
- **Layered Sourcing Engine**:
  - *Level 1 (Highest Trust)*: Internal human-curated catalog of verified courses and books.
  - *Level 2 (Automated Discovery)*: Real-time API discovery via YouTube Data API v3 and GitHub REST API when coverage gaps are detected.
- **Trellis Resource Score v1 Algorithm**:
  Every discovered candidate is analyzed and scored out of 100 based on a transparent 5-factor mathematical model:
  $$\text{Score} = 0.40(R_{\text{sem}}) + 0.20(Q_{\text{struct}}) + 0.15(E_{\text{log}}) + 0.15(C_{\text{auth}}) + 0.10(F_{\text{decay}})$$
  - **Semantic Relevance ($40\%$)**: Vector embedding similarity between target skill requirements and resource content/transcripts.
  - **Content Quality ($20\%$)**: Structural rigor, transcript clarity, code repository layout, and presence of comprehensive READMEs.
  - **Engagement Quality ($15\%$)**: Log-scaled view-to-like ratios, star growth, and subscriber engagement bounds.
  - **Creator / Repository Credibility ($15\%$)**: Domain authority, historical creator output consistency, and repository activity.
  - **Freshness Half-Life Degradation ($10\%$)**: Topic-aware temporal decay math:
    - *Fast-Moving Topics (e.g. LLMs, Frontend Frameworks)*: 1-year half-life.
    - *Moderate Topics (e.g. Cloud Architecture, DevOps)*: 3-year half-life.
    - *Stable Topics (e.g. Data Structures, Linear Algebra)*: 8-year half-life.
- **Strict Quality Admission Gate**: Resources must achieve a minimum composite score of **`80/100`** and confidence **`≥ 0.45`** to earn the `vetted` badge and become eligible for roadmap inclusion.

---

### ⚡ 3. Durable PostgreSQL Job Queue (Zero-Redis Overhead)
- **High-Throughput Asynchronous Worker**: Background resource discovery, transcript extraction, and AI scoring run in a dedicated worker process sharing the FastAPI runtime image.
- **PostgreSQL `FOR UPDATE SKIP LOCKED`**: Employs native database row locking to coordinate job allocation across worker instances without requiring a separate Redis or Celery deployment.
- **Idempotent Coverage Triggers**: Coverage gap discovery requests are deduplicated by learner profile version and skill requirement hash, eliminating redundant external API consumption and LLM costs.

---

### 🗺️ 4. Topological Prerequisite-Aware Roadmap Engine
- **Directed Acyclic Graph (DAG) Dependency Mapping**: Breaks down complex goals into milestone modules ordered strictly by skill dependencies (e.g. *Linear Algebra & Calculus $\rightarrow$ Machine Learning Fundamentals $\rightarrow$ Neural Networks $\rightarrow$ Transformer Architectures*).
- **Dynamic Hour Allocation & Date Scheduling**: Calculates milestone target dates dynamically using content duration, recommended practice buffers, and learner-defined weekly hours (e.g. 5 hrs/week vs 20 hrs/week).
- **Immutable Versioning & Human-in-the-Loop Adaptation**:
  - Roadmaps are stored as immutable version records (`v1`, `v2`, etc.).
  - When assessment failures or rapid progress warrant a roadmap modification, Trellis builds a **proposed draft adaptation**.
  - **Learner Agency Core Rule**: Proposed adaptations *never* overwrite the active roadmap automatically. The learner must review the diff and explicitly approve the change.

---

### 🤖 5. Contextual AI Assistant & Technical Interview Simulator
- **Roadmap-Aware Conversational Coach**: Embedded chat assistant with full real-time context over the learner's active roadmap, current milestone, skill evidence matrix, and target role. Explains *why* specific resources were selected over alternatives.
- **AI Interview Practice Agent**: Interactive technical and behavioral mock interview engine. Simulates real-world hiring questions tailored to the learner's target job title, providing instant evaluation feedback on response completeness, technical depth, and communication style.
- **Real-Time Job Gap Analysis**: Integrates with JSearch API to pull active market job openings, comparing job requirements directly against the learner's skill vector to pinpoint exact missing prerequisites.

---

### 🛡️ 6. Exception-Driven Admin Console & Content-Free Observability
- **Human-in-the-Loop Oversight**: Administrators use an exception console to review flagged resources, inspect low-confidence high-score anomalies, process learner reports, and manage manual score overrides.
- **Content-Free Telemetry**: Operational metrics track system latencies, error frequencies, and job throughput while guaranteeing zero persistence of sensitive user prompts or raw interview responses.

---

## 🛠️ Complete Technology Stack

### Frontend (`/client`)
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 18 (TypeScript) | Single Page Application UI rendering |
| **Build System** | Vite | Lightning-fast HMR and bundle optimization |
| **Styling** | Vanilla CSS / CSS Modules | Custom visual tokens, glassmorphism, responsive reflow |
| **Icons** | Lucide React | Modern, consistent UI iconography |
| **Auth Client** | Appwrite Web SDK | Client session management & JWT generation |
| **Unit Testing** | Vitest + React Testing Library | Fast component and state unit testing |
| **E2E Testing** | Playwright | Full end-to-end browser acceptance testing |

### Backend (`/server`)
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | FastAPI (Python 3.11+) | Asynchronous RESTful API services & schema validation |
| **Database** | PostgreSQL 17 + `pgvector` | Relational storage & high-performance vector search |
| **ORM / Migrations**| SQLAlchemy 2.0 & Alembic | Schema definition and ordered migration execution |
| **AI Processing** | Groq API (Llama 3 / Mixtral) | High-speed LLM goal parsing, transcript analysis & chat |
| **External APIs** | YouTube Data API, GitHub REST API, JSearch | Resource discovery & live job data fetching |
| **Worker Queue** | PostgreSQL `SKIP LOCKED` worker | Asynchronous background vetting & re-evaluation |
| **Auth & Files** | Appwrite Admin SDK | Server-side JWT verification & resume PDF storage |

---

## 📁 Detailed Repository Layout

```text
Trellis/
├── .env.example                # Root environment template
├── compose.yaml                # Production Docker Compose stack definition
├── compose.dev.yaml            # Development Docker Compose overrides (volume mounts)
├── Makefile                    # Operational CLI commands & task runner
├── PRODUCT.md                  # Product guidelines, design principles & brand voice
├── README.md                   # Root technical documentation (this file)
│
├── client/                     # React 18 TypeScript Single Page Application
│   ├── src/
│   │   ├── components/         # Reusable UI component modules
│   │   │   ├── app-shell/      # Navigation header, sidebar, app layout
│   │   │   ├── auth-components/# Login, register, modal auth handlers
│   │   │   ├── chat-components/# Conversational AI assistant interface
│   │   │   ├── jobs-components/# JSearch job matching & gap breakdown cards
│   │   │   ├── onboarding/     # Step-by-step goal & profile wizard
│   │   │   ├── profile-components/ # Skill tree, evidence matrix, resume loader
│   │   │   ├── resources/      # Resource cards, detail modals, feedback controls
│   │   │   └── roadmap-components/ # Milestone trees, quiz modals, adaptation diffs
│   │   ├── pages/              # Primary route view components
│   │   │   ├── AdminCatalog.tsx# Admin moderation & resource exception console
│   │   │   ├── Chat.tsx        # Standalone AI learning assistant page
│   │   │   ├── InterviewPrep.tsx# Mock interview simulator page
│   │   │   ├── Jobs.tsx        # Job market matching page
│   │   │   ├── Onboarding.tsx  # Resumable goal parsing flow
│   │   │   ├── Profile.tsx     # Learner evidence & skill profile page
│   │   │   └── Roadmap.tsx     # Core interactive learning roadmap page
│   │   ├── services/           # Backend HTTP client & Appwrite SDK wrappers
│   │   ├── contexts/           # React authentication and application state contexts
│   │   ├── index.css           # Global CSS design tokens, typography, utilities
│   │   ├── App.tsx             # Route definitions & top-level layout wrapper
│   │   └── main.tsx            # Application entry point
│   ├── e2e/                    # Playwright browser acceptance tests
│   ├── vite.config.ts          # Vite build, dev server & proxy settings
│   └── Dockerfile              # Multi-stage production Nginx & development Dockerfile
│
└── server/                     # FastAPI Application, Data Layer & Worker
    ├── main.py                 # FastAPI initialization, CORS, middleware, router mounts
    ├── database.py             # SQLAlchemy models (AppUser, UserProfile, Roadmap, Resource, etc.)
    ├── schemas.py              # Central Pydantic request/response validation schemas
    ├── config.py               # Application settings, environment variables & defaults
    ├── auth.py                 # Appwrite JWT authentication & RBAC dependency injection
    ├── goal_analyzer.py        # Natural language goal parsing & skill decomposition
    ├── goal_skill_planner.py   # Skill graph dependency resolution
    ├── roadmap_engine.py       # Prerequisite-aware roadmap construction & scheduling
    ├── profile_service.py      # Profile management, PDF resume parser, skill evidence
    ├── catalog_service.py      # Resource scoring (v1 engine), indexing & search
    ├── resource_providers.py   # YouTube, GitHub, and transcript fetching adapters
    ├── resource_worker.py      # Durable PostgreSQL task worker process
    ├── assessment_service.py   # Deterministic quiz generator & project rubric reviewer
    ├── adaptation_service.py   # Roadmap progress analysis & proposal diff generator
    ├── interview_agent.py      # Interactive mock interview simulation state machine
    ├── job_recommender.py      # JSearch API integration & skill gap scoring
    ├── chat_service.py         # RAG-enabled contextual AI assistant handler
    ├── errors.py               # Standardized application exception envelope handlers
    ├── telemetry.py            # Privacy-bounded operational performance metrics
    ├── migrations/             # Alembic database schema migration history
    ├── docs/                   # ARCHITECTURE.md and TESTING.md guides
    └── Dockerfile              # Multi-stage production API & Worker Dockerfile
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
Ensure the following tools are installed on your host machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0+)
- [Node.js](https://nodejs.org/) (v18.0+ for optional host client builds)
- [Python](https://www.python.org/) (v3.11+ for optional host server execution)
- An active [Appwrite](https://appwrite.io/) instance (Cloud or self-hosted Docker)

---

### 1. Environment Provisioning

Create local configuration files from provided templates:

```bash
# Root Compose configuration
cp .env.example .env

# Server FastAPI & Worker configuration
cp server/.env.example server/.env

# Client React configuration
cp client/.env.example client/.env
```

#### Essential Environment Configuration Reference (`server/.env`)

```env
# Database Settings
DATABASE_URL=postgresql://myuser:mypassword@db:5432/career_mentor_db

# Appwrite Integration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key

# AI Provider (Groq)
GROQ_API_KEY=gsk_your_groq_api_key_here

# External Discovery APIs
YOUTUBE_API_KEY=your_youtube_api_key
GITHUB_TOKEN=ghp_your_github_token
JSEARCH_API_KEY=your_jsearch_rapidapi_key

# Security & Roles
ADMIN_USER_IDS=appwrite_user_id_1,appwrite_user_id_2
PILOT_FEATURE_ENABLED=true
```

---

### 2. Docker Execution Modes

Trellis utilizes Docker Compose to coordinate FastAPI, React, PostgreSQL, and the background Worker.

#### 🟢 Development Environment (Live Hot-Reloading)
Mounts local source code directories into containers for instant live code reloading:

```bash
make dev
```
- **Client Web Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Endpoint Server**: [http://localhost:8085](http://localhost:8085)
- **Swagger Interactive API Documentation**: [http://localhost:8085/docs](http://localhost:8085/docs)
- **ReDoc API Specifications**: [http://localhost:8085/redoc](http://localhost:8085/redoc)

#### 🔵 Production-style Container Stack
Builds production-optimized Nginx frontend and production Python containers:

```bash
make prod
```
- **Client Reverse Proxy (Nginx)**: [http://localhost:8098](http://localhost:8098)
- **Backend API**: [http://localhost:8088](http://localhost:8088)

---

### 3. Operational Command Reference (`Makefile`)

The root `Makefile` provides a single interface for managing services, running tests, executing schema migrations, and checking system status:

```bash
# Service Controls
make dev                 # Start development container stack with live reload
make prod                # Start production container stack in background
make down                # Stop production stack
make dev-down            # Stop development stack
make ps                  # Display status of production services
make dev-ps              # Display status of development services

# Logging & Monitoring
make dev-logs            # Stream unified logs from all development containers
make dev-worker-logs     # Stream logs specifically from the resource worker container

# Quality & Testing Gates
make config              # Validate merged Docker Compose configuration files
make test                # Execute both backend (pytest) and frontend (vitest) test suites
make test-api            # Run backend pytest unit & integration tests
make test-client         # Run frontend Vitest suite
make lint                # Run frontend ESLint code quality scanner
make e2e                 # Execute Playwright browser acceptance tests

# Database Migration Operations
make migrate             # Apply all pending Alembic migrations to PostgreSQL
make migration-current   # Print the current database migration revision

# Environment Reset (Destructive)
make dev-destroy         # Tear down dev stack AND delete PostgreSQL data volume
make destroy             # Tear down production stack AND delete PostgreSQL data volume
```

---

## 📡 REST API Architecture & Envelope Conventions

All core Trellis endpoints are scoped under `/v1`. Except for public health check routes, all API calls require a valid Appwrite user JWT.

### Request Authorization Header
```http
Authorization: Bearer <appwrite-jwt-token>
```

### Standardized Error Envelope Format
All non-2xx responses adhere to a consistent error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required field 'weekly_hours' missing from request profile body",
    "details": [
      {
        "field": "weekly_hours",
        "issue": "Field is required and must be > 0"
      }
    ]
  }
}
```

### Core API Endpoint Directory

| Route Group | Path | Key Operations |
| :--- | :--- | :--- |
| **Profile & Onboarding** | `/v1/me/*` | Resume upload, hybrid onboarding draft saving, profile updates, skill tree retrieval |
| **Roadmaps** | `/v1/roadmaps/*` | Prerequisite roadmap generation, milestone status updates, quiz generation & submission |
| **Adaptation** | `/v1/roadmaps/{id}/adaptations` | Propose roadmap updates, view proposed diffs, approve or reject path changes |
| **Catalog & Resources** | `/v1/resources/*` | Vetted resource search, async discovery trigger, feedback submission (helpful/report) |
| **AI Chat Assistant** | `/v1/chat/messages` | Contextual conversational queries, recommendation explanations |
| **Career & Jobs** | `/v1/career/*` | JSearch job gap analysis, interactive mock interview session triggers |
| **Admin Operations** | `/v1/admin/*` | Resource score manual overrides, exception moderation queue, operational telemetry |

---

## 🧪 Comprehensive Quality & Verification Pipeline

To ensure reliability in pilot deployments, Trellis requires all quality gates to pass before code merges:

```bash
# 1. Verify Docker Compose setup
make config

# 2. Run Python & TypeScript Unit Tests
make test

# 3. Code Style & Syntax Validation
make lint

# 4. End-to-End User Journey Tests
make e2e
```

---

## 📜 Compliance, Accessibility & Standards

- **Accessibility**: Built to meet **WCAG 2.1 AA** standards across keyboard focus traps, ARIA labels, contrast ratios, and screen-reader reflow.
- **Privacy & Safety**: Learner prompts, resume texts, and raw transcript analyses are processed in-memory and never logged or exposed to third-party tracking.
- **Learner Agency**: System recommendations provide evidence provenance. No roadmap modification is applied without learner confirmation.

For further architectural specifications, refer to [server/docs/ARCHITECTURE.md](server/docs/ARCHITECTURE.md).  
For detailed testing strategy guidelines, refer to [server/docs/TESTING.md](server/docs/TESTING.md).
