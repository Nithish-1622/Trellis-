# Trellis 🌿

**AI-Powered Personalized Learning Path Recommender**

Trellis is a full-stack, pilot-ready personalized learning platform that transforms natural-language career and skill goals into evidence-driven, prerequisite-aware, and dynamically adaptive learning roadmaps. 

Powered by **FastAPI**, **React (TypeScript)**, **PostgreSQL with pgvector**, and **Appwrite**, Trellis leverages a multi-stage AI pipeline to profile learners, discover and automatically vet real-world learning resources from YouTube and GitHub, evaluate progress through quizzes and project rubrics, and deliver interactive AI coaching.

---

## 📐 Product Vision & Architecture

Trellis bridges the gap between fragmented online learning materials and individual goal achievement. Rather than presenting an unranked wall of course cards, Trellis acts as an intelligent, evidence-based learning coach that guarantees transparency, provenance, and learner agency.

```text
                                  +-----------------------+
                                  | Natural Language Goal |
                                  +-----------+-----------+
                                              |
                                              v
                              +-------------------------------+
                              |  Resumable Onboarding Engine  |
                              |  & Learner Profiling System   |
                              +---------------+---------------+
                                              |
                                              v
                              +-------------------------------+
                              | Skill Breakdown & Prior Logic |
                              +---------------+---------------+
                                              |
                                              v
                              +-------------------------------+
                              | Layered Resource Vetting      |
                              | (Internal + YouTube + GitHub) |
                              +---------------+---------------+
                                              |
                                              v
                              +-------------------------------+
                              |  Prerequisite-Aware Roadmap   |
                              |   Generation & Versioning     |
                              +---------------+---------------+
                                              |
       +--------------------------------------+--------------------------------------+
       |                                      |                                      |
       v                                      v                                      v
+--------------+                      +---------------+                      +---------------+
| Interactive  |                      | Assessment &  |                      | Adaptive Path |
| AI Assistant |                      | Evidence Engine|                      | Proposal      |
+--------------+                      +---------------+                      +---------------+
```

---

## ✨ Key Features

### 🎯 1. Resumable Hybrid Onboarding & Goal Analysis
- **Natural Language Parsing**: Analyzes unstructured goal descriptions (e.g. *"I want to become a Senior Backend Engineer specializing in Distributed Systems with Rust"*) into structured target skill sets.
- **Learner Profiling**: Captures experience level, weekly time commitment, prior completed courses/projects, and preferred content modalities (video, reading, hands-on).
- **Resume & Evidence Ingestion**: Parses uploaded PDF resumes into skill trees, assigning initial proficiency levels and weighted evidence confidence scores.

### 🗺️ 2. Prerequisite-Aware Versioned Roadmaps
- **Dependency Graph Planning**: Generates structured, milestone-driven roadmaps where each module explicitly maps prerequisites and target skill gains.
- **Scheduling Engine**: Calculates target target completion dates based on learner pace and weekly hour allocation.
- **Roadmap Versioning**: Maintains historical roadmap snapshots. Path updates never overwrite active work without explicit learner consent.

### 🔍 3. Layered Automated Resource Indexing & Vetting
- **Internal Catalog & External Discovery**: Combines a curated internal catalog with real-time discovery adapters for YouTube and GitHub.
- **Trellis Resource Score v1**: Evaluates candidates out of 100 based on a transparent 5-factor scoring model:
  - **40%** Semantic Relevance to target skill.
  - **20%** Content Quality & Structural Rigor.
  - **15%** Log-Scaled Engagement Quality.
  - **15%** Creator / Repository Credibility.
  - **10%** Freshness (with topic-specific half-life degradation).
- **Safety & Quality Gate**: Requires a minimum automated score of `80/100` and confidence `≥ 0.45` before resources are marked `vetted` and eligible for roadmap inclusion.
- **Zero URL Invention**: AI components select exclusively from verified and scored database resources, preventing hallucinated link bugs.

### 🧠 4. Evidence-Based Evaluation & Adaptation
- **Diagnostic Quizzes**: Deterministic skill assessment quizzes generated from vetted learning content to verify comprehension.
- **Provisional Project Rubrics**: Milestone projects evaluated against detailed criteria rubrics, feeding weighted skill evidence into the learner profile.
- **Learner-Approved Adaptation**: Adapts the upcoming roadmap sections based on assessment failures or rapid progress, requiring learner confirmation before applying changes.

### 💬 5. Contextual AI Assistant & Career Tools
- **Conversational Guide**: Embedded chat assistant with full context over the learner's active roadmap, target goals, and progress state. Explains *why* specific resources were recommended.
- **Interview Simulator**: Provides persistent technical and behavioral interview practice customized to target role descriptions.
- **Real Job Integration**: Matches real-time job listings (via JSearch API) against learner skill profiles, highlighting gap areas to prioritize.

### 🛡️ 6. Admin Moderation & Operational Telemetry
- **Exception Console**: Highlights flagged resources, low-confidence high-scoring items, stale links, and user reports.
- **Audit Logging**: Manual pins, overrides, and catalog modifications are logged with explicit admin rationale.
- **Content-Free Observability**: Tracks execution metrics, endpoint latencies, and worker throughput without recording sensitive user prompts.

---

## 🛠️ Technology Stack

### Frontend (`/client`)
- **Core**: React 18, TypeScript, Vite
- **Styling**: Modern CSS, CSS Modules, Lucide React Icons
- **State & Router**: React Router v6, React Context
- **Authentication**: Appwrite Web SDK (JWT handling)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

### Backend (`/server`)
- **Framework**: FastAPI (Python 3.11+), Pydantic v2
- **Database**: PostgreSQL 17 + `pgvector` extension
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **AI / LLM Integration**: Groq API (Llama 3 / Mixtral models) with fallback deterministic engines
- **External Adapters**: YouTube Data API v3, GitHub REST API, JSearch API
- **Worker Process**: PostgreSQL `FOR UPDATE SKIP LOCKED` durable task queue for async resource vetting
- **Auth & Storage**: Appwrite Admin SDK for token validation and file management

---

## 📁 Repository Structure

```text
Trellis/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Modular UI components (roadmap, chat, profile, jobs, admin)
│   │   ├── pages/              # Primary route views (Landing, Onboarding, Roadmap, Chat, etc.)
│   │   ├── services/           # Appwrite API client and backend HTTP integration
│   │   ├── contexts/           # Authentication and state contexts
│   │   └── hooks/              # Custom React hooks
│   ├── e2e/                    # Playwright end-to-end acceptance tests
│   ├── vite.config.ts          # Vite build & proxy configuration
│   └── Dockerfile              # Multi-stage production & dev Dockerfile
│
├── server/                     # Backend FastAPI & Background Worker
│   ├── database.py             # SQLAlchemy models, vector schemas, and DB setup
│   ├── main.py                 # FastAPI application composition & middleware
│   ├── roadmap_engine.py       # Dependency resolution & roadmap generation engine
│   ├── profile_service.py      # Learner profiling, resume parsing, evidence weighting
│   ├── catalog_service.py      # Resource scoring, indexing, and recommendation ranking
│   ├── resource_worker.py      # Background task worker for external resource discovery & vetting
│   ├── resource_providers.py   # YouTube, GitHub, and transcript adapters
│   ├── interview_agent.py      # AI interview session simulator
│   ├── job_recommender.py      # JSearch API integration & skill-gap matcher
│   ├── migrations/             # Alembic database migration scripts
│   ├── docs/                   # System architecture and testing documentation
│   └── Dockerfile              # Production & dev Dockerfile for API and Worker
│
├── compose.yaml                # Production Docker Compose specification
├── compose.dev.yaml            # Local development Compose overrides (live reload)
├── Makefile                    # Standardized development & operational CLI targets
├── PRODUCT.md                  # Product guidelines, brand voice, and design principles
└── README.md                   # Root system documentation (this file)
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 18+](https://nodejs.org/) (for client development)
- [Python 3.11+](https://www.python.org/) (for server development)
- An active [Appwrite](https://appwrite.io/) project (Cloud or Self-Hosted)

### 1. Environment Configuration

Copy environment templates at root, server, and client levels:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Key environment variables to configure in `server/.env` and `client/.env`:
- `VITE_APPWRITE_ENDPOINT` & `VITE_APPWRITE_PROJECT_ID`: Appwrite client credentials.
- `APPWRITE_API_KEY`: Appwrite server key for token verification.
- `GROQ_API_KEY`: Groq LLM API key for intelligent parsing and assistant capabilities.
- `YOUTUBE_API_KEY` & `GITHUB_TOKEN`: For background resource discovery.
- `ADMIN_USER_IDS`: Comma-separated list of Appwrite user IDs granted admin privileges.

---

### 2. Running with Docker (Recommended)

#### 🟢 Development Mode (Live Reloading)
Runs the frontend, FastAPI backend, background worker, and PostgreSQL database with volume mounts for live hot-reloading:

```bash
make dev
```
- **Client UI**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:8085](http://localhost:8085)
- **API Documentation**: [http://localhost:8085/docs](http://localhost:8085/docs)

#### 🔵 Production-style Local Deployment
Builds production artifacts and runs frontend reverse-proxied through Nginx:

```bash
make prod
```
- **Client App**: [http://localhost:8098](http://localhost:8098)
- **API Server**: [http://localhost:8088](http://localhost:8088)

---

### 3. Utility & Management Commands

Trellis includes a top-level `Makefile` for streamlined environment control:

| Command | Description |
| :--- | :--- |
| `make dev` | Launch development environment with live hot-reloading |
| `make prod` | Launch production Docker containers in background |
| `make down` / `make dev-down` | Stop production / development containers |
| `make dev-logs` | Stream logs from all development services |
| `make dev-worker-logs` | Stream background resource worker logs |
| `make migrate` | Execute Alembic schema migrations on PostgreSQL |
| `make migration-current` | View current active database schema revision |
| `make test` | Run complete backend (pytest) and frontend (vitest) unit test suites |
| `make lint` | Run frontend ESLint code quality checks |
| `make e2e` | Run Playwright end-to-end browser acceptance tests |
| `make dev-destroy` | **Destructive**: Stop dev containers and purge PostgreSQL volume |

---

## 📡 Core API Conventions

All application API endpoints are versioned under `/v1/*`. Requests authenticate via standard Authorization headers:

```http
Authorization: Bearer <appwrite-jwt>
```

### Primary API Groups

- **`/v1/me/*`**: Learner profile management, hybrid onboarding, resume uploads, skill history, and dashboard summary.
- **`/v1/roadmaps/*`**: Prerequisite-aware roadmap generation, versioning, milestone tracking, quiz/project submission, and roadmap adaptation proposals.
- **`/v1/resources/*`**: Verified catalog searches, vetting recommendation list, resource discovery triggers, and interaction feedback (helpful/report).
- **`/v1/chat/*`**: Context-aware AI assistant messaging for guidance and recommendation explanations.
- **`/v1/career/*`**: JSearch job matching, skill gap analysis, and interactive interview sessions.
- **`/v1/admin/*`**: Catalog management, resource score overrides, discovery logs, and exception console moderation.

---

## 🧪 Quality Gates & Testing

Trellis enforces strict testing and code quality standards across both tiers:

```bash
# Validate Compose Configurations
make config

# Run Backend Pytest Suite & Frontend Vitest Suite
make test

# Run ESLint on Frontend Codebase
make lint

# Run End-to-End Playwright Acceptance Suite
make e2e
```

---

## 📄 License & System Status

Trellis is built adhering to WCAG 2.1 AA accessibility guidelines, strict evidence provenance, and fault-tolerant micro-architecture. 

For detailed technical architecture specifications, see [server/docs/ARCHITECTURE.md](server/docs/ARCHITECTURE.md).  
For detailed testing strategy guidelines, see [server/docs/TESTING.md](server/docs/TESTING.md).
