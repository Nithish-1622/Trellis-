# Testing New Features

## ✅ Server Status
- Server running on http://localhost:8000
- Health check: PASSED

## 🎯 New API Endpoints to Test

### 1. Market Trends Analysis
```bash
curl -X POST http://localhost:8000/agent/market/trends \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Backend Engineer",
    "location": "Remote"
  }' | python3 -m json.tool
```

### 2. Learning Resources
```bash
curl -X POST http://localhost:8000/agent/resources/learning \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "Python",
    "level": "intermediate"
  }' | python3 -m json.tool
```

### 3. Job Recommendations
```bash
# First ensure a user profile exists
curl -X POST http://localhost:8000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "message": "I want to become a backend engineer with Python"
  }'

# Then get job recommendations
curl -X POST http://localhost:8000/agent/jobs/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_001",
    "limit": 5
  }' | python3 -m json.tool
```

### 4. Resume Parser (requires PDF/DOCX file)
```bash
# Create a test resume first, then:
curl -X POST http://localhost:8000/agent/resume/parse \
  -F "user_id=test_user_001" \
  -F "file=@/path/to/resume.pdf"
```

## 📊 What Each Feature Does

### Market Trends Analysis
- Analyzes job market for specific roles
- Returns: demand level, salary range, top skills, growth trajectory
- Uses Groq (Llama 3.3) for real-time insights

### Learning Resources
- Recommends courses, tutorials, videos, projects
- Platforms: Coursera, Udemy, YouTube, freeCodeCamp, GitHub
- Customized by skill level

### Job Recommendations
- Matches user skills to job opportunities
- Returns: company, title, match score, salary range
- Uses Gemini Embeddings for semantic matching

### Resume Parser
- Extracts structured data from PDF/DOCX
- Parses: name, email, skills, experience, education
- Auto-updates user profile with extracted skills

