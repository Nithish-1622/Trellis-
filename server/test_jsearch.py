"""Direct test of JSearch API integration."""
import asyncio
from sqlalchemy.orm import Session
from database import get_db, init_db
from job_recommender import job_engine
import logging

logging.basicConfig(level=logging.INFO)

async def test_jsearch():
    """Test JSearch API integration."""
    print("=" * 70)
    print("TESTING JSEARCH API INTEGRATION")
    print("=" * 70)
    
    # Initialize DB
    init_db()
    db = next(get_db())
    
    print("\n1. Testing with test_arthi (has profile from resume parsing)...")
    jobs = await job_engine.recommend_jobs(
        db=db,
        user_id="test_arthi",
        limit=3,
        use_real_jobs=True
    )
    
    if not jobs:
        print("❌ No jobs returned!")
        return
    
    print(f"\n✅ Received {len(jobs)} jobs\n")
    
    for i, job in enumerate(jobs, 1):
        print(f"Job #{i}:")
        print(f"  Company: {job.get('company')}")
        print(f"  Title: {job.get('title')}")
        print(f"  Location: {job.get('location')}")
        print(f"  Source: {job.get('source', 'AI-generated')}")
        print(f"  Match Score: {job.get('match_score')}")
        print(f"  URL: {job.get('url')[:80]}...")
        print(f"  Salary: ${job.get('salary_range', {}).get('min', 'N/A')} - ${job.get('salary_range', {}).get('max', 'N/A')}")
        print()
    
    # Check if real jobs
    has_real_jobs = any(job.get('source') == 'JSearch API' for job in jobs)
    
    if has_real_jobs:
        print("✅ SUCCESS: Real jobs from JSearch API!")
    else:
        print("❌ WARNING: Jobs are AI-generated, not from JSearch API")

if __name__ == "__main__":
    asyncio.run(test_jsearch())
