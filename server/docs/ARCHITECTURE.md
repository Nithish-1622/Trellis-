# 📋 Project Structure Overview

This document explains the architecture and organization of the Career Mentor backend.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│                  (Handles Authentication)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP + user_id
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  API Layer (main.py)                  │  │
│  │           Protected Endpoints + CORS                  │  │
│  └─────────────────────┬─────────────────────────────────┘  │
│                        │                                    │
│  ┌─────────────────────▼─────────────────────────────────┐  │
│  │            Service Layer (services.py)                │  │
│  │         Business Logic + Orchestration                │  │
│  └─────┬─────────────────────────────────────────────────┘  │
│        │                                                    │
│  ┌─────▼──────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │  LangGraph     │  │  Memory System │  │  Database    │   │
│  │  Agent Graph   │◄─┤  (memory.py)   │◄─┤ (database.py)│   │
│  └────────────────┘  └────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Groq API   │  │  Google      │  │ PostgreSQL / │        │
│  │ (Llama 3.3) │  │  Gemini      │  │ SQLite       │        │
│  │             │  │ (Embeddings) │  │              │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
server/
│
├── 📄 main.py                      # FastAPI app + endpoints
├── 📄 config.py                    # Configuration management
├── 📄 database.py                  # SQLAlchemy models
├── 📄 schemas.py                   # Pydantic models
├── 📄 services.py                  # Business logic layer
├── 📄 memory.py                    # Long-term memory system
│
├── 📁 graph/                       # LangGraph components
│   ├── __init__.py
│   ├── state.py                   # Agent state definition
│   ├── nodes.py                   # Agent node functions
│   ├── tools.py                   # Agent tools
│   └── career_graph.py            # Main graph workflow
│
├── 📄 requirements.txt             # Python dependencies
├── 📄 .env.example                # Environment template
├── 📄 .gitignore                  # Git ignore rules
│
├── 📄 README.md                   # Main documentation
├── 📄 SETUP.md                    # Setup guide
├── 📄 start.sh                    # Quick start script
├── 📄 example_usage.py            # Usage examples
│
├── 📄 Dockerfile                  # Docker image definition
└── 📄 docker-compose.yml          # Multi-container setup
```

## 🔍 Component Details

### Core Application Files

#### `main.py` - FastAPI Application

- **Purpose**: API endpoints and HTTP handling
- **Responsibilities**:
  - Define REST endpoints
  - Request validation
  - CORS configuration
  - Error handling
  - Health checks
- **Key Routes**:
  - `POST /agent/message` - Main conversation
  - `GET /agent/memory/summary` - Memory retrieval
  - `POST /agent/roadmap/regenerate` - Generate roadmap
  - `POST /agent/milestone/complete` - Log completion
  - `POST /agent/application/outcome` - Track applications
  - `GET /agent/progress/weekly` - Progress summary

#### `config.py` - Configuration

- **Purpose**: Centralized configuration management
- **Features**:
  - Environment variable loading
  - Type-safe settings with Pydantic
  - Default values
  - CORS origins parsing
- **Key Settings**:
  - Database URL
  - Groq API configuration (Llama 3.3)
  - Google Gemini API configuration (Embeddings)
  - Agent parameters
  - Memory thresholds

#### `database.py` - Data Models

- **Purpose**: Database schema and ORM
- **Models**:
  - `UserProfile` - User career data
  - `Memory` - Episodic/semantic memories
  - `Milestone` - Roadmap tasks
  - `Application` - Job applications
  - `Roadmap` - Learning plans
- **Features**:
  - Relationships between models
  - JSON fields for flexible data
  - Timestamps and metadata

#### `schemas.py` - API Schemas

- **Purpose**: Request/response validation
- **Models**:
  - Request models (e.g., `AgentMessageRequest`)
  - Response models (e.g., `AgentMessageResponse`)
  - Domain models (e.g., `Skill`, `Milestone`)
  - Enums for status values
- **Features**:
  - Type validation
  - Field constraints
  - Serialization

#### `services.py` - Business Logic

- **Purpose**: High-level operations and orchestration
- **Key Class**: `CareerMentorService`
- **Methods**:
  - `process_message()` - Handle user messages
  - `get_memory_summary()` - Retrieve user context
  - `regenerate_roadmap()` - Generate learning path
  - `complete_milestone()` - Update progress
  - `log_application_outcome()` - Track applications
  - `get_weekly_progress()` - Calculate metrics
- **Features**:
  - Database transactions
  - Memory integration
  - Graph invocation

#### `memory.py` - Memory System

- **Purpose**: Long-term memory management
- **Key Class**: `MemoryManager`
- **Capabilities**:
  - Add memories with embeddings (Google Gemini)
  - Semantic search (cosine similarity)
  - Retrieve by importance/recency
  - Memory consolidation
- **Memory Types**:
  - **Episodic**: Conversations, events
  - **Semantic**: Skills, patterns, knowledge
  - **Feedback**: Outcomes, learning

### LangGraph Components

#### `graph/state.py` - State Definition

- **Purpose**: Define agent state structure
- **Key Type**: `AgentState` (TypedDict)
- **State Fields**:
  - Conversation messages
  - User profile context
  - Active roadmap
  - Recent memories
  - Intent detection
  - Action parameters
  - Response data

#### `graph/nodes.py` - Node Functions

- **Purpose**: Agent processing nodes
- **Key Class**: `AgentNodes`
- **Nodes**:
  1. `load_context` - Load user profile & memories
  2. `understand_intent` - Classify user intent with LLM
  3. `execute_action` - Perform skill analysis, roadmap gen, etc.
  4. `generate_response` - Create personalized response
  5. `save_memory` - Store interaction in memory
- **Features**:
  - Async execution
  - State transformations
  - LLM integration

#### `graph/tools.py` - Agent Tools

- **Purpose**: Tools for agent to use
- **Key Class**: `CareerMentorTools`
- **Tools**:
  - `read_user_profile()` - Get user data
  - `update_user_skills()` - Modify skills
  - `get_skill_gaps()` - Analyze gaps
  - `analyze_market_trends()` - Market insights
  - `generate_project_ideas()` - Learning projects
  - `find_learning_resources()` - Curated resources
  - `get_recent_applications()` - Application history

#### `graph/career_graph.py` - Main Graph

- **Purpose**: Orchestrate agent workflow
- **Key Class**: `CareerMentorGraph`
- **Graph Flow**:
  ```
  START
    ↓
  load_context
    ↓
  understand_intent
    ↓
  [conditional] execute_action?
    ↓
  generate_response
    ↓
  save_memory
    ↓
  END
  ```
- **Features**:
  - State checkpointing
  - Conditional edges
  - Thread-based sessions

## 🔄 Data Flow

### 1. User Message Flow

```
1. Frontend sends message + user_id
   ↓
2. main.py receives request, validates schema
   ↓
3. CareerMentorService.process_message() invoked
   ↓
4. CareerMentorGraph.run() starts LangGraph
   ↓
5. Graph executes nodes sequentially:
   - Load user profile from DB
   - Retrieve relevant memories (semantic search)
   - Understand intent (LLM classification)
   - Execute action if needed (skill analysis, etc.)
   - Generate response (LLM with context)
   - Save to memory (with embeddings)
   ↓
6. Response returned to frontend
```

### 2. Memory Retrieval Flow

```
1. User message arrives
   ↓
2. MemoryManager.retrieve_relevant_memories()
   ↓
3. Generate query embedding (Google Embeddings API)
   ↓
4. Query database for user's memories
   ↓
5. Calculate cosine similarity for each memory
   ↓
6. Return top-k most similar memories
   ↓
7. Memories added to agent context
```

### 3. Roadmap Generation Flow

```
1. Request to regenerate roadmap
   ↓
2. Load user profile (skills, target role)
   ↓
3. Analyze skill gaps (compare current vs required)
   ↓
4. Generate milestones (projects + resources)
   ↓
5. Create Roadmap & Milestone records in DB
   ↓
6. Add high-importance memory (for future context)
   ↓
7. Return structured roadmap
```

## 🗄️ Database Schema

### Tables & Relationships

```
user_profiles (1) ──┬─► (N) memories
                    ├─► (N) roadmaps
                    ├─► (N) milestones
                    └─► (N) applications

roadmaps (1) ───────► (N) milestones
```

### Key Fields

**user_profiles**:

- `user_id` (PK)
- `current_role`, `target_role`
- `skills` (JSON: [{name, level, last_used}])
- `career_goals` (JSON)

**memories**:

- `id` (PK)
- `user_id` (FK)
- `content` (text)
- `embedding` (vector/JSON)
- `memory_type` (episodic/semantic/feedback)
- `importance` (0-1 score)

**roadmaps**:

- `id` (PK)
- `user_id` (FK)
- `target_role`
- `skill_gaps` (JSON array)
- `is_active` (boolean)

**milestones**:

- `id` (PK)
- `user_id`, `roadmap_id` (FK)
- `title`, `description`
- `status` (not_started/in_progress/completed)
- `skills_to_learn` (JSON array)
- `resources` (JSON array)

**applications**:

- `id` (PK)
- `user_id` (FK)
- `company`, `position`
- `status` (applied/interview/rejected/accepted)
- `feedback` (text)

## 🚀 Execution Flow Examples

### Example 1: "I want to become a backend engineer"

```
1. load_context
   - Creates new user profile
   - No memories yet

2. understand_intent
   - Intent: "roadmap_request"
   - Requires action: true

3. execute_action
   - Call get_skill_gaps("Backend Engineer")
   - Returns: ["REST APIs", "Databases", "Docker", ...]

4. generate_response
   - LLM generates personalized advice
   - "To become a backend engineer, you'll need to learn..."
   - Suggestions: ["Start with REST API basics", "Learn SQL"]

5. save_memory
   - Store conversation (episodic)
   - Store career goal (semantic, high importance)
```

### Example 2: "I got rejected from TechCorp"

```
1. load_context
   - Load profile
   - Retrieve memories about TechCorp application

2. understand_intent
   - Intent: "application_help"
   - Requires action: false (just empathy + advice)

3. [skip action]

4. generate_response
   - LLM uses memory context
   - "I see you applied to TechCorp. Let's learn from this..."
   - Action items: ["Review feedback", "Focus on system design"]

5. save_memory
   - Store outcome (feedback, high importance)
   - Will influence future roadmap
```

## 🎯 Key Design Decisions

### 1. Stateful Agent (LangGraph)

- **Why**: Maintain context across complex workflows
- **Benefit**: Can pause, resume, and checkpoint progress

### 2. Dual Memory System

- **Episodic**: Tracks timeline of events
- **Semantic**: Stores extracted knowledge
- **Benefit**: Rich context retrieval, learning from patterns

### 3. Embeddings for Memory

- **Why**: Enable semantic similarity search
- **Benefit**: Agent finds relevant context even without exact keywords

### 4. Separation of Concerns

- **API Layer**: HTTP handling
- **Service Layer**: Business logic
- **Graph Layer**: Agent reasoning
- **Benefit**: Easy to test, maintain, extend

### 5. Database Flexibility

- **SQLite**: Quick start, development
- **PostgreSQL**: Production scale, vector search
- **Benefit**: Smooth development → production path

## 📊 Performance Considerations

### Optimization Strategies

1. **Database**:

   - Index on `user_id` for fast user queries
   - Connection pooling for high concurrency
   - Consider pgvector for true vector search

2. **Memory**:

   - Cache frequently accessed profiles
   - Batch embedding generation
   - Limit memory retrieval (top-k only)

3. **LLM Calls**:

   - Use gemini-pro-flash for speed
   - Implement request caching
   - Parallel tool calls where possible

4. **API**:
   - Enable compression
   - Use async endpoints
   - Implement rate limiting

## 🔐 Security Notes

1. **Authentication**: Handled by frontend
2. **Authorization**: Trust user_id from authenticated requests
3. **Data Privacy**: Each user sees only their data
4. **API Keys**: Stored in environment, never in code
5. **CORS**: Restricted to known origins

## 📈 Extensibility

### Easy to Add

1. **New Agent Tools**:

   - Add method to `CareerMentorTools`
   - Use in `execute_action` node

2. **New Endpoints**:

   - Add route to `main.py`
   - Create service method
   - Define request/response schemas

3. **New Memory Types**:

   - Just use different `memory_type` string
   - No schema changes needed

4. **Job API Integration**:

   - Add API client to `tools.py`
   - Use in `analyze_market_trends()`

5. **Resume Generation**:
   - Add resume table to `database.py`
   - Create resume generation tool
   - Add endpoint in `main.py`

## 🎓 Learning Path

**For New Developers**:

1. Start with `main.py` - understand endpoints
2. Read `schemas.py` - see data structures
3. Explore `services.py` - business logic
4. Dive into `graph/` - agent intelligence
5. Study `memory.py` - long-term learning

**For Customization**:

1. Modify `tools.py` - change skill requirements
2. Edit `nodes.py` - adjust agent behavior
3. Extend `database.py` - add new data types
4. Update `main.py` - expose new features

---

This architecture provides a solid foundation for a production-grade AI career mentor that learns and evolves with each user interaction! 🚀
