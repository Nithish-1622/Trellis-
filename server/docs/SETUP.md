# 🚀 Setup Guide - Career Mentor API

This guide will walk you through setting up the Career Mentor backend from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Recommended)](#quick-start-recommended)
3. [Manual Setup](#manual-setup)
4. [Docker Setup](#docker-setup)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Groq Cloud Account** for Llama 3.3 ([Get API Key](https://console.groq.com/))
- **Google Cloud Account** for Embeddings ([Get API Key](https://ai.google.dev/))

### Optional (Choose one for database)

- **PostgreSQL 14+** with pgvector extension (recommended for production)
- **SQLite 3** (simpler, great for development)

### Optional (for Docker deployment)

- **Docker** & **Docker Compose** ([Install](https://docs.docker.com/get-docker/))

---

## Quick Start (Recommended)

### 1. Navigate to server directory

```bash
cd server
```

### 2. Run the quick start script

```bash
chmod +x start.sh
./start.sh
```

The script will:

- ✅ Check Python version
- ✅ Create virtual environment
- ✅ Install dependencies
- ✅ Create `.env` from template
- ✅ Initialize database
- ✅ Start the server

### 3. Configure API Key

When prompted, edit `.env` and add your API keys:

```env
GROQ_API_KEY="your_groq_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"
```

### 4. Run the script again

```bash
./start.sh
```

### 5. Test the API

Visit: http://localhost:8000/docs

---

## Manual Setup

### Step 1: Create Virtual Environment

```bash
cd server
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
GROQ_API_KEY="your_groq_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"

# Database (choose one)
DATABASE_URL="sqlite:///./career_mentor.db"
# OR
DATABASE_URL="postgresql://user:pass@localhost:5432/career_mentor_db"
```

### Step 4: Set Up Database

#### Option A: SQLite (Easiest)

No additional setup needed! The database file will be created automatically.

#### Option B: PostgreSQL (Recommended for Production)

**Install PostgreSQL:**

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-16 postgresql-contrib-16

# Windows: Download from https://www.postgresql.org/download/windows/
```

**Install pgvector extension:**

```bash
# macOS
brew install pgvector

# Ubuntu/Debian
sudo apt-get install postgresql-16-pgvector

# From source (all platforms)
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

**Create database:**

```bash
# Connect to PostgreSQL
psql postgres

# Create database and enable extension
CREATE DATABASE career_mentor_db;
\c career_mentor_db
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

**Update .env:**

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/career_mentor_db"
```

### Step 5: Initialize Database

```bash
python3 -c "from database import init_db; init_db()"
```

### Step 6: Start Server

```bash
# Development mode (auto-reload on code changes)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode (multiple workers)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Step 7: Verify Setup

Open your browser:

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/

---

## Docker Setup

### Option 1: Using Docker Compose (Full Stack)

**Prerequisites:**

- Docker & Docker Compose installed
- `.env` file configured

**Start everything:**

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop services
docker-compose down
```

This starts:

- ✅ Career Mentor API (port 8000)
- ✅ PostgreSQL with pgvector (port 5432)

**Access:**

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Option 2: API Only (Standalone)

**Build image:**

```bash
docker build -t career-mentor-api .
```

**Run container:**

```bash
# With SQLite
docker run -p 8000:8000 \
  -e GOOGLE_API_KEY="your_key" \
  -e DATABASE_URL="sqlite:///./career_mentor.db" \
  -v $(pwd)/data:/app/data \
  career-mentor-api

# With external PostgreSQL
docker run -p 8000:8000 \
  -e GOOGLE_API_KEY="your_key" \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/db" \
  career-mentor-api
```

---

## Configuration

### Essential Settings

#### `.env` File

```env
# ============== REQUIRED ==============
GOOGLE_API_KEY="your_gemini_api_key_here"

# ============== DATABASE ==============
# SQLite (simple)
DATABASE_URL="sqlite:///./career_mentor.db"

# PostgreSQL (recommended)
# DATABASE_URL="postgresql://user:pass@localhost:5432/career_mentor_db"

# ============== MODEL CONFIG ==============
GROQ_MODEL="llama-3.3-70b-versatile"
GEMINI_EMBEDDING_MODEL="models/text-embedding-004"

# ============== API CONFIG ==============
API_HOST="0.0.0.0"
API_PORT=8000
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"

# ============== AGENT CONFIG ==============
MAX_ITERATIONS=15
CHECKPOINT_ENABLED=True
MEMORY_SIMILARITY_THRESHOLD=0.7

# ============== OPTIONAL: LANGSMITH ==============
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=""
LANGCHAIN_PROJECT="career-mentor"
```

### Model Selection

**gemini-pro**: More capable, better reasoning, slower (~2-3s)  
**gemini-pro-flash**: Faster responses (~0.5-1s), good for most cases

### Database Selection

**SQLite**:

- ✅ Zero setup
- ✅ Perfect for development
- ❌ Not ideal for high concurrency

**PostgreSQL + pgvector**:

- ✅ Production-ready
- ✅ Better performance at scale
- ✅ True vector similarity search
- ❌ Requires setup

---

## Testing

### 1. Manual API Testing

**Using cURL:**

```bash
# Health check
curl http://localhost:8000/

# Send message to agent
curl -X POST http://localhost:8000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test123",
    "message": "I want to become a backend developer. What should I learn?"
  }'
```

**Using Python:**

```bash
python example_usage.py
```

This script runs a complete user journey test covering:

- ✅ Agent conversation
- ✅ Skill assessment
- ✅ Roadmap generation
- ✅ Milestone completion
- ✅ Application tracking
- ✅ Memory & context retention

### 2. Interactive API Docs

Visit: http://localhost:8000/docs

Features:

- 📖 Complete API documentation
- 🧪 Interactive testing (try out endpoints)
- 📋 Request/response schemas
- 🔐 No auth required (handled by frontend)

### 3. Verify Database

**SQLite:**

```bash
sqlite3 career_mentor.db
.tables
SELECT * FROM user_profiles;
.quit
```

**PostgreSQL:**

```bash
psql career_mentor_db
\dt
SELECT * FROM user_profiles;
\q
```

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**

```bash
# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Database connection failed"

**For SQLite:**

- Check file permissions in the server directory
- Ensure `DATABASE_URL` in `.env` is correct

**For PostgreSQL:**

- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env`
- Test connection: `psql career_mentor_db`
- Verify pgvector: `psql -d career_mentor_db -c "CREATE EXTENSION IF NOT EXISTS vector;"`

### Issue: "Invalid API key" or Gemini errors

**Solution:**

1. Get API key from: https://ai.google.dev/
2. Verify it's correctly set in `.env`:
   ```env
   GOOGLE_API_KEY="your_actual_key_here"
   ```
3. Restart the server after changing `.env`

### Issue: CORS errors from frontend

**Solution:**
Update `CORS_ORIGINS` in `.env`:

```env
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,https://yourdomain.com"
```

### Issue: Port 8000 already in use

**Solution:**

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or use different port
uvicorn main:app --port 8001
```

### Issue: "Table doesn't exist" errors

**Solution:**

```bash
# Reinitialize database
python3 -c "from database import init_db; init_db()"
```

### Issue: Slow responses

**Solutions:**

1. Switch to `gemini-pro-flash`: Edit `.env`

   ```env
   GEMINI_MODEL="gemini-pro-flash"
   ```

2. Use PostgreSQL instead of SQLite for better performance

3. Enable connection pooling (for Postgres):
   ```env
   DATABASE_URL="postgresql://user:pass@localhost/db?pool_size=20&max_overflow=10"
   ```

### Issue: Memory/embeddings not working

**Check:**

1. Verify Gemini API key is valid
2. Check logs for embedding errors: Look at terminal output
3. Ensure internet connection is stable

### Issue: Docker container won't start

**Debug:**

```bash
# Check logs
docker-compose logs api

# Check database
docker-compose logs db

# Restart everything
docker-compose down
docker-compose up --build
```

---

## Next Steps

Once setup is complete:

1. **Test the API**: Run `python example_usage.py`
2. **Read the README**: Check [README.md](README.md) for API details
3. **Integrate with Frontend**: Use the protected endpoints
4. **Customize**: Extend agent tools, add new features
5. **Deploy**: Use Docker or cloud platforms

---

## Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **LangGraph Docs**: https://python.langchain.com/docs/langgraph
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Gemini API**: https://ai.google.dev/docs

---

## Need Help?

1. Check the logs for detailed error messages
2. Verify all prerequisites are installed
3. Ensure `.env` is properly configured
4. Try the troubleshooting steps above
5. Review the example usage script

---

**You're all set! 🎉**

Run the server and start building your career mentor experience!
