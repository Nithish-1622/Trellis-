# 🎯 Career Mentor Backend - Project Overview

## 📦 Complete File Structure

```
server/
│
├── 📄 main.py                          [FastAPI app + 7 protected endpoints]
├── 📄 config.py                        [Configuration management]
├── 📄 database.py                      [SQLAlchemy models: 5 tables]
├── 📄 schemas.py                       [Pydantic models: 15+ schemas]
├── 📄 services.py                      [Business logic layer]
├── 📄 memory.py                        [Long-term memory + embeddings]
│
├── 📁 graph/                           [LangGraph Agent Components]
│   ├── __init__.py                    [Package exports]
│   ├── state.py                       [Agent state definition]
│   ├── nodes.py                       [5 workflow nodes]
│   ├── tools.py                       [8 agent tools]
│   └── career_graph.py                [Main graph orchestration]
│
├── 📄 requirements.txt                 [Python dependencies]
├── 📄 .env.example                    [Environment template]
├── 📄 .gitignore                      [Git exclusions]
│
├── 📄 README.md                       [Main documentation - 400+ lines]
├── 📄 SETUP.md                        [Setup guide - 500+ lines]
├── 📄 ARCHITECTURE.md                 [Technical deep dive - 600+ lines]
├── 📄 IMPLEMENTATION_SUMMARY.md       [This deliverable summary]
│
├── 📄 start.sh                        [Quick start script]
├── 📄 example_usage.py                [Working usage examples]
│
├── 📄 Dockerfile                      [Production Docker image]
└── 📄 docker-compose.yml              [Full stack deployment]
```

**Total: 20 files | ~3,500+ lines of production code**

---

## 🎨 System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                          │
│              ┌─────────────────────────────┐                  │
│              │   Authentication Layer      │                  │
│              │  (Appwrite/Firebase/Auth0)  │                  │
│              └──────────┬──────────────────┘                  │
│                         │ JWT/Session                         │
│                         │ Extract user_id                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                          │ HTTP POST + user_id
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND (main.py)                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             7 Protected Endpoints                      │   │
│  │  /agent/message | /roadmap/current | /milestone/...   │   │
│  └─────────────────────┬──────────────────────────────────┘   │
│                        │ Request Validation (Pydantic)        │
│                        │                                       │
│  ┌─────────────────────▼──────────────────────────────────┐   │
│  │          SERVICE LAYER (services.py)                   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │      CareerMentorService                         │  │   │
│  │  │  • process_message()                            │  │   │
│  │  │  • regenerate_roadmap()                         │  │   │
│  │  │  • complete_milestone()                         │  │   │
│  │  │  • log_application_outcome()                    │  │   │
│  │  └──────────┬───────────────────┬───────────────────┘  │   │
│  └─────────────┼───────────────────┼──────────────────────┘   │
└────────────────┼───────────────────┼──────────────────────────┘
                 │                   │
      ┌──────────▼────────┐    ┌─────▼─────────┐
      │  LangGraph Agent  │    │  Memory       │
      │  (career_graph)   │◄───┤  Manager      │
      └──────────┬────────┘    └─────┬─────────┘
                 │                   │
      ┌──────────▼────────────────────▼─────────┐
      │            Workflow Nodes                │
      │  1. load_context      (DB + Memory)     │
      │  2. understand_intent (LLM)             │
      │  3. execute_action    (Tools)           │
      │  4. generate_response (LLM)             │
      │  5. save_memory       (DB)              │
      └──────────┬──────────────────────────────┘
                 │
      ┌──────────▼──────────────────────────────┐
      │          Agent Tools                     │
      │  • Skill gap analysis                   │
      │  • Market trends                        │
      │  • Project ideas                        │
      │  • Learning resources                   │
      └──────────┬──────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────┐  ┌────────▼──────────┐
│    Groq API    │  │  Google Gemini    │
│  (Llama 3.3)   │  │   (Embeddings)    │
│ • Reasoning    │  │ • Memory Search   │
│ • Parsing      │  │ • User Profiles   │
└────────────────┘  └────────┬──────────┘
                         │
                    ┌────▼───────┐
                    │ Database   │
                    │ PostgreSQL │
                    └────────────┘
```

---

## 🔄 Request Flow Example

### User: "I want to become a backend developer"

```
1. Frontend
   └─► POST /agent/message {user_id: "123", message: "..."}

2. main.py (API Layer)
   └─► Validate request → Call service

3. services.py (Business Logic)
   └─► CareerMentorService.process_message()

4. career_graph.py (Agent)
   │
   ├─► Node 1: load_context
   │   ├─► Query DB for user profile
   │   ├─► Semantic search for relevant memories
   │   └─► Load recent applications
   │
   ├─► Node 2: understand_intent
   │   ├─► LLM classifies intent: "roadmap_request"
   │   └─► Set requires_action=True
   │
   ├─► Node 3: execute_action
   │   ├─► Tool: get_skill_gaps("Backend Developer")
   │   │   └─► Returns: ["REST APIs", "Databases", "Docker"]
   │   ├─► Tool: generate_project_ideas(gaps)
   │   └─► Tool: analyze_market_trends()
   │
   ├─► Node 4: generate_response
   │   ├─► Build context with all data
   │   ├─► LLM generates personalized response
   │   └─► Extract suggestions & action items
   │
   └─► Node 5: save_memory
       ├─► Save user message (episodic)
       ├─► Save agent response (episodic)
       ├─► Save action taken (semantic, high importance)
       └─► Generate & store embeddings

5. Response to Frontend
   {
     "response": "Great goal! To become a backend developer...",
     "suggestions": ["Learn REST APIs", "Practice with FastAPI"],
     "action_items": ["Create roadmap", "Start first project"],
     "metadata": {"intent": "roadmap_request"}
   }
```

---

## 🗄️ Database Schema

```sql
-- User Profile (Career Data)
user_profiles
├─ user_id (PK)
├─ current_role
├─ target_role
├─ experience_years
├─ skills (JSON)        -- [{name, level, last_used}]
├─ career_goals (JSON)  -- [{target_role, timeline}]
└─ interests (JSON)

-- Long-term Memory
memories
├─ id (PK)
├─ user_id (FK → user_profiles)
├─ content (TEXT)
├─ embedding (JSON/VECTOR)  -- For semantic search
├─ memory_type              -- episodic|semantic|feedback
├─ importance (0-1)
├─ tags (JSON)
└─ created_at

-- Learning Roadmaps
roadmaps
├─ id (PK)
├─ user_id (FK → user_profiles)
├─ target_role
├─ skill_gaps (JSON)
├─ estimated_completion_weeks
├─ is_active (BOOLEAN)
└─ generated_at

-- Roadmap Milestones
milestones
├─ id (PK)
├─ user_id (FK → user_profiles)
├─ roadmap_id (FK → roadmaps)
├─ title
├─ description
├─ status                   -- not_started|in_progress|completed
├─ skills_to_learn (JSON)
├─ estimated_hours
├─ deadline
├─ completed_at
└─ resources (JSON)

-- Job Applications
applications
├─ id (PK)
├─ user_id (FK → user_profiles)
├─ company
├─ position
├─ status                   -- applied|interview|rejected|accepted
├─ applied_date
├─ feedback (TEXT)
└─ interview_topics (JSON)
```

---

## 🛠️ Technology Stack

| **Web Framework**    | FastAPI                 | REST API endpoints             |
| **Agent Framework**  | LangGraph               | Stateful agent orchestration   |
| **LLM**              | Groq (Llama 3.3 70B)    | Natural language reasoning     |
| **Embeddings**       | Google Gemini           | Semantic search                |
| **Database**         | PostgreSQL / SQLite     | Persistent storage             |
| **Vector Store**     | pgvector / In-memory    | Similarity search              |
| **ORM**              | SQLAlchemy              | Database abstraction           |
| **Validation**       | Pydantic                | Type safety                    |
| **Async**            | asyncio                 | Concurrent operations          |
| **Containerization** | Docker                  | Deployment                     |

---

## 📊 API Endpoints Reference

### POST /agent/message

**Purpose**: Main conversation with agent  
**Input**: `{user_id, message, context?}`  
**Output**: `{response, suggestions[], action_items[], metadata}`

### GET /agent/memory/summary

**Purpose**: Get user's memory & profile summary  
**Input**: `?user_id=...`  
**Output**: `{skills[], goals[], applications_count, ...}`

### GET /agent/roadmap/current

**Purpose**: Retrieve active learning roadmap  
**Input**: `?user_id=...`  
**Output**: `{target_role, milestones[], skill_gaps[], ...}`

### POST /agent/roadmap/regenerate

**Purpose**: Generate new personalized roadmap  
**Input**: `{user_id, target_role?, timeline_weeks?}`  
**Output**: `{roadmap with milestones}`

### POST /agent/milestone/complete

**Purpose**: Mark milestone as done + update skills  
**Input**: `{user_id, milestone_id, reflection?, learned_skills[]}`  
**Output**: `{success: true}`

### POST /agent/application/outcome

**Purpose**: Log job application for learning  
**Input**: `{user_id, company, position, status, feedback?}`  
**Output**: `{application_id}`

### GET /agent/progress/weekly

**Purpose**: Weekly progress summary  
**Input**: `?user_id=...&week_offset=0`  
**Output**: `{milestones_completed, skills_learned[], hours, ...}`

---

## 🚀 Getting Started in 3 Steps

```bash
# 1. Setup
cd server
./start.sh

# 2. Configure (edit .env)
GROQ_API_KEY="your_groq_key"
GOOGLE_API_KEY="your_google_key"

# 3. Test
python example_usage.py
```

Visit: http://localhost:8000/docs

---

## 💡 Key Features

✅ **Persistent Memory**: Remembers all interactions with semantic search  
✅ **Adaptive Learning**: Learns from feedback and refines strategy  
✅ **Skill Tracking**: Analyzes gaps and generates personalized roadmaps  
✅ **Career Tracking**: Logs applications, interviews, outcomes  
✅ **Contextual Responses**: Uses conversation history and user profile  
✅ **Proactive Suggestions**: Recommends jobs, projects, resources  
✅ **Progress Monitoring**: Weekly summaries and milestone tracking  
✅ **Production Ready**: Type-safe, error handling, logging, Docker

---

## 🎯 What Makes This Special

1. **True Long-Term Memory**: Not just RAG - semantic + episodic memory with continuous learning
2. **Stateful Agent**: LangGraph checkpointing allows pause/resume workflows
3. **Adaptive Intelligence**: Agent learns from outcomes and adjusts strategy
4. **Production Architecture**: Clean layers, type safety, scalability
5. **Easy Extension**: Add tools, endpoints, memory types without refactoring

---

## 📚 Documentation

- **[README.md](README.md)** - Features, API reference, usage examples
- **[SETUP.md](SETUP.md)** - Installation, configuration, troubleshooting
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical deep dive
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Deliverable checklist

Interactive Docs: **http://localhost:8000/docs**

---

## 🎊 Ready to Deploy!

This backend is production-ready and can be deployed to:

- Docker containers
- AWS (ECS, Lambda, App Runner)
- Google Cloud (Cloud Run)
- Azure (App Service, Container Instances)
- Heroku, Railway, Fly.io

All you need:

1. Set environment variables
2. Connect to PostgreSQL (or use SQLite)
3. Deploy!

---

**Built with ❤️ by a senior Python/Agentic AI expert**

_For questions, check the documentation or run the example script!_
