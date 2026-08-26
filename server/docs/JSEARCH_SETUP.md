# JSearch API Setup Guide

## 🎯 What is JSearch?

JSearch is a job search aggregator API that provides real-time job listings from:

- LinkedIn
- Indeed
- Glassdoor
- ZipRecruiter
- Monster
- CareerBuilder

## 🔑 Getting Your API Key (FREE)

### Step 1: Create RapidAPI Account

1. Go to [RapidAPI.com](https://rapidapi.com/)
2. Click **Sign Up** (free account)
3. Verify your email

### Step 2: Subscribe to JSearch API

1. Visit [JSearch API Page](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Click **Subscribe to Test**
3. Choose **Basic Plan** (FREE):
   - ✅ 100 requests/month
   - ✅ No credit card required
   - ✅ Access to all endpoints

### Step 3: Get Your API Key

1. After subscribing, go to the **Endpoints** tab
2. Look for the code snippet section
3. Copy your `X-RapidAPI-Key` (looks like: `abc123def456...`)

### Step 4: Add to `.env` File

```bash
cd server
nano .env  # or use your favorite editor
```

Add these lines:

```env
JSEARCH_API_KEY="your_rapidapi_key_here"
JSEARCH_API_HOST="jsearch.p.rapidapi.com"
```

## 🚀 How It Works

### 1. Real Job Fetching

```python
# The system searches JSearch with user's profile:
query = "Backend Engineer Python React"
location = "Remote"
employment_type = "FULLTIME"

# Returns real jobs from LinkedIn, Indeed, etc.
```

### 2. Semantic Matching with Google Gemini

```python
# Each job is scored using embeddings:
user_profile = "Backend Engineer with Python, Docker, AWS experience"
job_description = "Senior Backend Developer needed with Python..."

# Gemini Embeddings calculates semantic similarity (0-100 score)
match_score = calculate_semantic_match(user_profile, job_description)
```

### 3. Intelligent Ranking

- Jobs are sorted by **semantic match score**
- Top matching jobs are returned first
- Real apply URLs included

## 📊 API Response Format

Real jobs include:

```json
{
  "company": "Google",
  "title": "Senior Backend Engineer",
  "location": "Mountain View, CA",
  "job_type": "Full-time",
  "experience_required": 5,
  "required_skills": ["Python", "Kubernetes", "AWS"],
  "salary_range": {
    "min": 150000,
    "max": 200000,
    "currency": "USD"
  },
  "description": "We are looking for...",
  "url": "https://careers.google.com/jobs/12345",
  "match_score": 87.5,
  "posted_date": "2025-12-25T10:00:00Z",
  "source": "JSearch API",
  "logo": "https://logo.url/google.png"
}
```

## 🔄 Fallback Mechanism

If JSearch API is unavailable:

1. System logs a warning
2. Falls back to AI-generated jobs (Llama 3.3 via Groq)
3. Still provides relevant recommendations

## 💡 Free Tier Limits

**Basic Plan (Free):**

- 100 requests/month
- ~3 requests/day
- Perfect for testing and small apps

**Pro Plan ($9.99/month):**

- 1000 requests/month
- ~33 requests/day

**Ultra Plan ($49.99/month):**

- 10,000 requests/month
- ~333 requests/day

## 🧪 Testing the Integration

```bash
# Test job recommendations with real jobs
curl -X POST "http://localhost:8000/agent/jobs/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "limit": 5
  }' | python3 -m json.tool
```

Look for:

- `"source": "JSearch API"` - Real jobs
- `"url"`: Real apply links (LinkedIn, Indeed, etc.)
- `"match_score"`: Semantic similarity score

## 🎯 Benefits Over AI-Generated Jobs

| Feature           | JSearch API          | AI-Generated  |
| ----------------- | -------------------- | ------------- |
| Real Companies    | ✅ Yes               | ❌ Fictional  |
| Apply URLs        | ✅ Working links     | ❌ Dummy URLs |
| Current Openings  | ✅ Live jobs         | ❌ Made up    |
| Salary Data       | ✅ Actual ranges     | ❌ Estimates  |
| Job Details       | ✅ Full descriptions | ❌ Generic    |
| Semantic Matching | ✅ Gemini Embeddings | ✅ Gemini Embeddings |

## 🔒 Security Notes

- Never commit `.env` file to git
- Keep your API key private
- RapidAPI monitors for abuse
- Rate limits prevent overuse

## 📚 Additional Resources

- [JSearch API Documentation](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
- [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- [Google Gemini API Docs](https://ai.google.dev/docs)

## 🆘 Troubleshooting

**"JSearch API key not configured"**

- Check `.env` file has `JSEARCH_API_KEY`
- Restart the server after adding key

**"401 Unauthorized"**

- Verify API key is correct
- Check subscription status on RapidAPI

**"Rate limit exceeded"**

- Upgrade to Pro plan ($9.99/month)
- Or wait until next month for free tier reset

**Empty results**

- Try broader search terms
- Check `date_posted` parameter (currently set to last 30 days)
- Verify location is valid
