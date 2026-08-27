# API Testing Guide - Quick Reference

## Server Control

```bash
# Start server
cd /home/agspades/projects/educat-anokha/server
conda activate aiml
uvicorn main:app --host 0.0.0.0 --port 8000

# Run all tests
python test_functionality.py

# Kill server
pkill -f "uvicorn main:app"
```

## API Endpoints

### 1. Health Check

```bash
curl http://localhost:8000/
```

### 2. Get Memory Summary

```bash
curl "http://localhost:8000/agent/memory/summary?user_id=YOUR_USER_ID"
```

### 3. Generate Roadmap

```bash
curl -X POST http://localhost:8000/agent/roadmap/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "target_role": "Backend Engineer",
    "timeline_weeks": 12
  }'
```

### 4. Get Current Roadmap

```bash
curl "http://localhost:8000/agent/roadmap/current?user_id=YOUR_USER_ID"
```

### 5. Complete Milestone

```bash
curl -X POST http://localhost:8000/agent/milestone/complete \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "milestone_id": "MILESTONE_ID",
    "reflection": "Completed successfully!",
    "learned_skills": ["FastAPI", "PostgreSQL"]
  }'
```

### 6. Log Application

```bash
curl -X POST http://localhost:8000/agent/application/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "company": "TechCorp",
    "position": "Backend Engineer",
    "status": "applied",
    "feedback": "Strong technical background",
    "interview_topics": ["REST APIs", "Databases"]
  }'
```

### 7. Weekly Progress

```bash
curl "http://localhost:8000/agent/progress/weekly?user_id=YOUR_USER_ID&week_offset=0"
```

### 8. Agent Conversation (Requires API quota)

```bash
curl -X POST http://localhost:8000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID",
    "message": "Hi! I am a computer science student. I know Python and SQL. I want to become a backend engineer."
  }'
```

## Database Access

```bash
# Connect to PostgreSQL
psql -U postgres -d career_mentor_db

# View tables
\dt

# Query user profiles
SELECT * FROM user_profiles;

# Query roadmaps
SELECT * FROM roadmaps;

# Query milestones
SELECT * FROM milestones;

# Query applications
SELECT * FROM applications;

# Query memories
SELECT * FROM memories;
```

## Supported Roles

- Backend Engineer / Backend Developer
- Frontend Developer
- Fullstack Developer
- Software Engineer
- Data Scientist
- ML Engineer
- DevOps Engineer

## Application Statuses

- `applied` - Application submitted
- `interview` - Interview scheduled/completed
- `offer` - Offer received
- `rejected` - Application rejected

## Milestone Statuses

- `not_started` - Not yet begun
- `in_progress` - Currently working on
- `completed` - Finished
- `skipped` - Decided not to pursue

## Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -i :8000

# Kill existing process
pkill -f "uvicorn main:app"
```

### Database connection error

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify pgvector extension
psql -U postgres -d career_mentor_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### API quota error (429)

- Using free tier of Google Gemini API
- Wait for quota reset (usually 24 hours)
- Or upgrade to paid tier
- Or use alternative LLM provider

### Import errors

```bash
# Ensure conda environment is active
conda activate aiml

# Reinstall dependencies
pip install -r requirements.txt
```

## Development Tips

1. **Auto-reload server** (development mode):

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **View API docs**:

   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Check logs**:

   ```bash
   # Server logs are in terminal
   # Or redirect to file:
   uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | tee server.log
   ```

4. **Test single endpoint**:

   ```bash
   # Pretty print JSON response
   curl -s http://localhost:8000/endpoint | python -m json.tool
   ```

5. **Reset database** (careful - deletes all data):
   ```sql
   DROP DATABASE career_mentor_db;
   CREATE DATABASE career_mentor_db;
   ```
   Then restart server to recreate tables.
