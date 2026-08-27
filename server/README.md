# 🚀 Agentic AI Career Mentor - Backend

A production-ready, stateful AI career mentor backend built with **FastAPI** and **LangGraph**. This system provides long-term memory, adaptive learning roadmaps, job recommendations, and continuous skill tracking for career development.

## 🎯 Features

### Core Capabilities

- **Persistent Career Memory**: Semantic + episodic memory with vector embeddings
- **Skill Gap Analysis**: Analyze current skills vs target tech roles (2025 market)
- **Adaptive Roadmaps**: Generate and continuously refine personalized learning paths
- **Job Recommendations**: Proactive matching with realistic opportunities
- **Application Tracking**: Log outcomes, learn from rejections/interviews
- **Progress Monitoring**: Weekly summaries + milestone tracking
- **Conversational Agent**: Natural language interaction with context retention

### Technical Highlights

- **LangGraph** for stateful agent orchestration with checkpointing
- **Google Gemini** (Pro/Flash) for LLM capabilities
- **PostgreSQL + pgvector** for persistence
- **Semantic search** via embeddings for memory retrieval
- **Production-ready**: Type hints, logging, error handling, CORS

---

## 📁 Project Structure

```
server/
├── main.py                  # FastAPI application entry point
├── config.py                # Configuration management
├── database.py              # SQLAlchemy models & database setup
├── schemas.py               # Pydantic request/response models
├── services.py              # Business logic layer
├── memory.py                # Long-term memory system
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
│
└── graph/                   # LangGraph agent components
    ├── __init__.py
    ├── state.py            # Agent state definition
    ├── nodes.py            # Agent node implementations
    ├── tools.py            # Agent tools (memory, market data)
    └── career_graph.py     # Main LangGraph workflow
```

---

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.10+
- PostgreSQL 14+ (with pgvector extension) OR SQLite 3
- Google Cloud account (for Gemini API key)

### 1. Clone & Navigate

```bash
cd server
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
GOOGLE_API_KEY="your_gemini_api_key_here"
DATABASE_URL="postgresql://user:pass@localhost:5432/career_mentor_db"

# Or use SQLite (simpler for development)
# DATABASE_URL="sqlite:///./career_mentor.db"

# Optional
GEMINI_MODEL="gemini-pro"  # or gemini-pro-flash for faster responses
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### 5. Initialize Database

#### For PostgreSQL:

```bash
# Create database
createdb career_mentor_db

# Install pgvector extension
psql career_mentor_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### For SQLite:

No setup needed - database file will be created automatically.

### 6. Run the Server

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 7. Verify Installation

Visit `http://localhost:8000/docs` to see the interactive API documentation.

---

## 🔌 API Endpoints

### Health Check

```http
GET /
```

Returns API status and version.

### Agent Conversation

```http
POST /agent/message
Content-Type: application/json

{
  "user_id": "user123",
  "message": "I want to become a full-stack developer. What skills do I need?",
  "context": {}  // optional
}
```

**Response:**

```json
{
  "response": "Great goal! To become a full-stack developer in 2025...",
  "suggestions": [
    "Start with React fundamentals",
    "Learn Node.js and Express",
    "Practice building full-stack projects"
  ],
  "action_items": [
    "Complete your profile with current skills",
    "Set up your learning roadmap"
  ],
  "metadata": {
    "intent": "roadmap_request",
    "action_taken": true
  }
}
```

### Memory Summary

```http
GET /agent/memory/summary?user_id=user123
```

Returns user's skills, goals, application history, and memory insights.

### Get Current Roadmap

```http
GET /agent/roadmap/current?user_id=user123
```

Returns active learning roadmap with milestones.

### Regenerate Roadmap

```http
POST /agent/roadmap/regenerate
Content-Type: application/json

{
  "user_id": "user123",
  "target_role": "Full-Stack Developer",
  "focus_areas": ["React", "Node.js", "System Design"],
  "timeline_weeks": 12
}
```

### Complete Milestone

```http
POST /agent/milestone/complete
Content-Type: application/json

{
  "user_id": "user123",
  "milestone_id": "milestone_uuid",
  "reflection": "Built a full-stack app with auth, learned a lot about JWT!",
  "learned_skills": ["JWT", "React Context", "Express middleware"]
}
```

### Log Application Outcome

```http
POST /agent/application/outcome
Content-Type: application/json

{
  "user_id": "user123",
  "company": "TechCorp",
  "position": "Frontend Developer",
  "status": "interview",
  "feedback": "Strong portfolio, need to improve system design",
  "interview_topics": ["React hooks", "Performance optimization", "State management"]
}
```

### Weekly Progress

```http
GET /agent/progress/weekly?user_id=user123&week_offset=0
```

Returns progress summary for current/past weeks.

---

## 🧠 How the Agent Works

### LangGraph Workflow

```
1. load_context       → Load user profile, memories, roadmap
2. understand_intent  → Classify user intent (LLM-powered)
3. execute_action     → Generate roadmap/analyze skills/search jobs
4. generate_response  → Create personalized response with suggestions
5. save_memory        → Store conversation in long-term memory
```

### Memory System

**Episodic Memory**: Stores conversations and events  
**Semantic Memory**: Stores consolidated knowledge (skills, patterns)  
**Feedback Memory**: High-importance outcomes (rejections, insights)

Memories are:

- Embedded using Google's embedding model
- Retrieved via semantic search (cosine similarity)
- Weighted by importance and recency

### Skill Gap Analysis

The agent compares user's current skills against target role requirements using:

- Curated 2025 tech skill databases
- Market trend analysis (extensible with real APIs)
- Personalized recommendations based on user context

---

## 🔧 Configuration Options

### Environment Variables

| Variable                      | Default                        | Description                |
| ----------------------------- | ------------------------------ | -------------------------- |
| `GOOGLE_API_KEY`              | _required_                     | Gemini API key             |
| `GEMINI_MODEL`                | `gemini-pro`                   | Model to use (pro/flash)   |
| `DATABASE_URL`                | `sqlite:///./career_mentor.db` | Database connection        |
| `MAX_ITERATIONS`              | `15`                           | Max agent iterations       |
| `VECTOR_DIMENSION`            | `768`                          | Embedding dimension        |
| `MEMORY_SIMILARITY_THRESHOLD` | `0.7`                          | Semantic search threshold  |
| `CHECKPOINT_ENABLED`          | `True`                         | Enable state checkpointing |

---

## 📊 Database Schema

### Core Tables

**user_profiles**: User career data (skills, goals, experience)  
**memories**: Episodic/semantic memory entries with embeddings  
**roadmaps**: Generated learning roadmaps  
**milestones**: Roadmap tasks with status tracking  
**applications**: Job application tracking with outcomes

### Relationships

- UserProfile → Memories (1:N)
- UserProfile → Roadmaps (1:N)
- Roadmap → Milestones (1:N)
- UserProfile → Applications (1:N)

---

## 🚀 Usage Examples

### Example 1: First-Time User

```python
# Frontend sends after user signs up
POST /agent/message
{
  "user_id": "user123",
  "message": "I'm a computer science student graduating in 2025. I know Python and SQL. I want to work as a backend engineer at a tech company."
}

# Agent will:
# 1. Create user profile
# 2. Analyze skill gaps for backend engineer role
# 3. Suggest creating a roadmap
# 4. Store this context in memory
```

### Example 2: Returning User

```python
# User returns after completing a project
POST /agent/message
{
  "user_id": "user123",
  "message": "I just finished building a REST API with FastAPI and PostgreSQL!"
}

# Agent will:
# 1. Retrieve relevant memories (past conversations about learning backend)
# 2. Recognize milestone completion
# 3. Update skill levels (FastAPI, PostgreSQL)
# 4. Suggest next steps (deployment, testing)
# 5. Store achievement in memory
```

### Example 3: Application Tracking

```python
# User got rejected
POST /agent/application/outcome
{
  "user_id": "user123",
  "company": "StartupXYZ",
  "position": "Backend Engineer",
  "status": "rejected",
  "feedback": "Need stronger understanding of distributed systems"
}

# Later conversation
POST /agent/message
{
  "user_id": "user123",
  "message": "What should I focus on next?"
}

# Agent will:
# 1. Retrieve rejection feedback from memory
# 2. Identify "distributed systems" as a gap
# 3. Prioritize this in roadmap
# 4. Recommend specific learning resources
```

---

## 🧪 Testing

```bash
# Run with test data
python -c "
from database import init_db
init_db()
print('✅ Database initialized')
"

# Test API endpoints
curl http://localhost:8000/
curl -X POST http://localhost:8000/agent/message \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "test123", "message": "Hello!"}'
```

---

## 🔐 Security Notes

**Important**: This backend assumes authentication is handled by the frontend.

- All endpoints expect `user_id` in request
- No password/token validation in this layer
- Frontend should:
  - Verify user authentication (Appwrite, Firebase, etc.)
  - Include verified `user_id` in requests
  - Protect API with rate limiting/API gateway

For production:

- Add middleware to verify JWT tokens
- Implement rate limiting (e.g., slowapi)
- Use secrets manager for API keys
- Enable HTTPS only

---

## 📈 Scaling & Production

### Performance Tips

- Use PostgreSQL + pgvector for better performance at scale
- Enable connection pooling: `DATABASE_URL=postgresql://...?pool_size=20`
- Cache frequent queries (Redis)
- Use `gemini-pro-flash` for faster responses

### Monitoring

- Enable LangSmith tracing: `LANGCHAIN_TRACING_V2=true`
- Add APM (New Relic, DataDog)
- Log to centralized system (CloudWatch, Elasticsearch)

### Deployment

```bash
# Docker
docker build -t career-mentor-api .
docker run -p 8000:8000 --env-file .env career-mentor-api

# Cloud (AWS/Azure/GCP)
# Use managed Postgres + container service (ECS, Cloud Run, App Service)
```

---

## 🛣️ Future Enhancements

- [ ] Integrate real job APIs (LinkedIn, Indeed, GitHub Jobs)
- [ ] Add resume parsing & generation
- [ ] Interview practice simulation
- [ ] Skill assessment quizzes
- [ ] Peer comparison & benchmarking
- [ ] Integration with GitHub for project tracking
- [ ] Slack/Discord bot interface
- [ ] Multi-language support

---

## 📝 License

MIT License - Free to use for personal and commercial projects.

---

## 🤝 Contributing

Contributions welcome! Key areas:

- Additional agent tools (GitHub integration, job APIs)
- Enhanced memory consolidation strategies
- UI/UX improvements for frontend integration
- Testing & documentation

---

## 📞 Support

For issues or questions:

1. Check API docs: `http://localhost:8000/docs`
2. Review logs for error details
3. Ensure `.env` is properly configured
4. Verify database connection

---

**Built with ❤️ using FastAPI, LangGraph, and Google Gemini**
