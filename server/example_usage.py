"""
Example usage of the Career Mentor API

This file demonstrates how to interact with the API programmatically.
Run this after starting the server with: uvicorn main:app --reload
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

# Test user ID (in production, this comes from frontend auth)
USER_ID = "test_user_123"


def pretty_print(title, data):
    """Helper to print formatted JSON."""
    print(f"\n{'='*60}")
    print(f"📊 {title}")
    print('='*60)
    print(json.dumps(data, indent=2))
    print()


def test_health_check():
    """Test API health."""
    response = requests.get(f"{BASE_URL}/")
    pretty_print("Health Check", response.json())
    return response.status_code == 200


def test_first_conversation():
    """Test initial user conversation."""
    payload = {
        "user_id": USER_ID,
        "message": "Hi! I'm a computer science student. I know Python, basic SQL, and Git. I want to become a backend engineer. Can you help me?"
    }
    
    response = requests.post(f"{BASE_URL}/agent/message", json=payload)
    pretty_print("First Conversation", response.json())
    return response.json()


def test_skill_assessment():
    """Ask agent to assess skills."""
    payload = {
        "user_id": USER_ID,
        "message": "What skills am I missing to become a backend engineer?"
    }
    
    response = requests.post(f"{BASE_URL}/agent/message", json=payload)
    pretty_print("Skill Assessment", response.json())
    return response.json()


def test_roadmap_generation():
    """Generate a learning roadmap."""
    payload = {
        "user_id": USER_ID,
        "target_role": "Backend Engineer",
        "timeline_weeks": 12
    }
    
    response = requests.post(f"{BASE_URL}/agent/roadmap/regenerate", json=payload)
    pretty_print("Generated Roadmap", response.json())
    return response.json()


def test_get_current_roadmap():
    """Retrieve current roadmap."""
    response = requests.get(
        f"{BASE_URL}/agent/roadmap/current",
        params={"user_id": USER_ID}
    )
    
    if response.status_code == 200:
        pretty_print("Current Roadmap", response.json())
        return response.json()
    else:
        print(f"⚠️  No roadmap found (status {response.status_code})")
        return None


def test_complete_milestone(milestone_id):
    """Mark a milestone as complete."""
    payload = {
        "user_id": USER_ID,
        "milestone_id": milestone_id,
        "reflection": "Built a REST API with FastAPI! Learned about async programming and database connections.",
        "learned_skills": ["FastAPI", "Async Python", "PostgreSQL", "REST API Design"]
    }
    
    response = requests.post(f"{BASE_URL}/agent/milestone/complete", json=payload)
    pretty_print("Milestone Completion", response.json())
    return response.json()


def test_log_application():
    """Log a job application outcome."""
    payload = {
        "user_id": USER_ID,
        "company": "TechStartup Inc",
        "position": "Backend Developer Intern",
        "status": "interview",
        "feedback": "Strong technical skills, need to improve system design knowledge",
        "interview_topics": ["REST APIs", "Database optimization", "System design"]
    }
    
    response = requests.post(f"{BASE_URL}/agent/application/outcome", json=payload)
    pretty_print("Application Logged", response.json())
    return response.json()


def test_memory_summary():
    """Get user's memory summary."""
    response = requests.get(
        f"{BASE_URL}/agent/memory/summary",
        params={"user_id": USER_ID}
    )
    
    pretty_print("Memory Summary", response.json())
    return response.json()


def test_weekly_progress():
    """Get weekly progress."""
    response = requests.get(
        f"{BASE_URL}/agent/progress/weekly",
        params={"user_id": USER_ID, "week_offset": 0}
    )
    
    pretty_print("Weekly Progress", response.json())
    return response.json()


def test_contextual_conversation():
    """Test that agent remembers context."""
    payload = {
        "user_id": USER_ID,
        "message": "I just got rejected from that startup. What should I do next?"
    }
    
    response = requests.post(f"{BASE_URL}/agent/message", json=payload)
    pretty_print("Contextual Response (Should reference previous application)", response.json())
    return response.json()


def run_complete_flow():
    """Run a complete user journey."""
    print("\n" + "="*60)
    print("🎯 Running Complete User Journey")
    print("="*60)
    
    try:
        # 1. Health check
        print("\n1️⃣ Testing health check...")
        assert test_health_check(), "Health check failed!"
        
        # 2. First conversation
        print("\n2️⃣ First conversation with agent...")
        test_first_conversation()
        
        # 3. Skill assessment
        print("\n3️⃣ Asking for skill assessment...")
        test_skill_assessment()
        
        # 4. Generate roadmap
        print("\n4️⃣ Generating personalized roadmap...")
        roadmap = test_roadmap_generation()
        
        # 5. Get current roadmap
        print("\n5️⃣ Retrieving current roadmap...")
        current_roadmap = test_get_current_roadmap()
        
        # 6. Complete a milestone (if roadmap exists)
        if current_roadmap and current_roadmap.get('milestones'):
            print("\n6️⃣ Completing first milestone...")
            first_milestone_id = current_roadmap['milestones'][0]['id']
            test_complete_milestone(first_milestone_id)
        
        # 7. Log an application
        print("\n7️⃣ Logging job application...")
        test_log_application()
        
        # 8. Check memory
        print("\n8️⃣ Checking memory summary...")
        test_memory_summary()
        
        # 9. Weekly progress
        print("\n9️⃣ Getting weekly progress...")
        test_weekly_progress()
        
        # 10. Contextual conversation
        print("\n🔟 Testing contextual memory...")
        test_contextual_conversation()
        
        print("\n" + "="*60)
        print("✅ All tests completed successfully!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 Career Mentor API - Example Usage                   ║
║                                                           ║
║   Make sure the server is running:                       ║
║   $ uvicorn main:app --reload                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    input("Press Enter to start the complete user journey test...\n")
    
    run_complete_flow()
    
    print("\n💡 Tips:")
    print("   - Check http://localhost:8000/docs for interactive API docs")
    print("   - Modify USER_ID to test different users")
    print("   - Run individual test functions for specific features")
    print()
