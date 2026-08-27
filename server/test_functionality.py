"""Test script for Career Mentor API functionalities."""
import asyncio
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
USER_ID = "test_user_comprehensive"

def print_test(name, passed, details=""):
    """Print test result."""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status}: {name}")
    if details:
        print(f"   {details}")

def test_health_check():
    """Test 1: Health Check"""
    try:
        response = requests.get(f"{BASE_URL}/")
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Health Check", passed, f"Status: {data.get('status')}, Version: {data.get('version')}")
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False

def test_memory_summary_empty():
    """Test 2: Memory Summary (Empty User)"""
    try:
        response = requests.get(f"{BASE_URL}/agent/memory/summary", params={"user_id": USER_ID})
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Memory Summary (New User)", passed, 
                  f"Skills: {len(data.get('skills', []))}, Goals: {len(data.get('career_goals', []))}")
        return passed, data
    except Exception as e:
        print_test("Memory Summary (New User)", False, str(e))
        return False, {}

def test_roadmap_generation():
    """Test 3: Roadmap Generation"""
    try:
        payload = {
            "user_id": USER_ID,
            "target_role": "Backend Engineer",
            "timeline_weeks": 12
        }
        response = requests.post(f"{BASE_URL}/agent/roadmap/regenerate", json=payload)
        passed = response.status_code == 200
        data = response.json() if passed else {}
        milestones_count = len(data.get('milestones', []))
        print_test("Roadmap Generation", passed, 
                  f"Generated roadmap with {milestones_count} milestones for {data.get('target_role', 'N/A')}")
        return passed, data
    except Exception as e:
        print_test("Roadmap Generation", False, str(e))
        return False, {}

def test_get_current_roadmap():
    """Test 4: Get Current Roadmap"""
    try:
        response = requests.get(f"{BASE_URL}/agent/roadmap/current", params={"user_id": USER_ID})
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Get Current Roadmap", passed, 
                  f"Milestones: {len(data.get('milestones', []))}, Weeks: {data.get('estimated_completion_weeks', 'N/A')}")
        return passed, data
    except Exception as e:
        print_test("Get Current Roadmap", False, str(e))
        return False, {}

def test_complete_milestone(milestone_id):
    """Test 5: Complete Milestone"""
    try:
        payload = {
            "user_id": USER_ID,
            "milestone_id": milestone_id,
            "reflection": "Successfully learned the concepts through hands-on practice!",
            "learned_skills": ["FastAPI", "REST APIs", "PostgreSQL"]
        }
        response = requests.post(f"{BASE_URL}/agent/milestone/complete", json=payload)
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Complete Milestone", passed, 
                  f"Success: {data.get('success', False)}")
        return passed
    except Exception as e:
        print_test("Complete Milestone", False, str(e))
        return False

def test_log_application():
    """Test 6: Log Application Outcome"""
    try:
        payload = {
            "user_id": USER_ID,
            "company": "TechCorp Inc",
            "position": "Backend Engineer Intern",
            "status": "interview",
            "feedback": "Strong technical skills, need to improve system design",
            "interview_topics": ["REST APIs", "Database Design", "Docker"]
        }
        response = requests.post(f"{BASE_URL}/agent/application/outcome", json=payload)
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Log Application", passed, 
                  f"Application ID: {data.get('application_id', 'N/A')}")
        return passed
    except Exception as e:
        print_test("Log Application", False, str(e))
        return False

def test_weekly_progress():
    """Test 7: Weekly Progress"""
    try:
        response = requests.get(f"{BASE_URL}/agent/progress/weekly", 
                              params={"user_id": USER_ID, "week_offset": 0})
        passed = response.status_code == 200
        data = response.json() if passed else {}
        print_test("Weekly Progress", passed, 
                  f"Completed: {data.get('milestones_completed', 0)}, "
                  f"Skills learned: {len(data.get('new_skills_learned', []))}, "
                  f"Applications: {data.get('applications_submitted', 0)}")
        return passed
    except Exception as e:
        print_test("Weekly Progress", False, str(e))
        return False

def test_database_persistence():
    """Test 8: Database Persistence (reload data)"""
    try:
        # Get memory summary again to verify data persists
        response = requests.get(f"{BASE_URL}/agent/memory/summary", params={"user_id": USER_ID})
        passed = response.status_code == 200
        data = response.json() if passed else {}
        has_data = (data.get('completed_milestones', 0) > 0 or 
                   data.get('total_applications', 0) > 0)
        print_test("Database Persistence", passed and has_data, 
                  f"Milestones: {data.get('completed_milestones', 0)}, "
                  f"Applications: {data.get('total_applications', 0)}")
        return passed and has_data
    except Exception as e:
        print_test("Database Persistence", False, str(e))
        return False

def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("🧪 Career Mentor API - Functionality Tests")
    print("="*70)
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Empty user memory
    passed, _ = test_memory_summary_empty()
    results.append(("Memory Summary (Empty)", passed))
    
    # Test 3: Generate roadmap
    passed, roadmap_data = test_roadmap_generation()
    results.append(("Roadmap Generation", passed))
    
    # Test 4: Get current roadmap
    passed, current_roadmap = test_get_current_roadmap()
    results.append(("Get Current Roadmap", passed))
    
    # Test 5: Complete milestone (if we have one)
    if current_roadmap and current_roadmap.get('milestones'):
        milestone_id = current_roadmap['milestones'][0]['id']
        passed = test_complete_milestone(milestone_id)
        results.append(("Complete Milestone", passed))
    else:
        print_test("Complete Milestone", False, "No milestones available")
        results.append(("Complete Milestone", False))
    
    # Test 6: Log application
    results.append(("Log Application", test_log_application()))
    
    # Test 7: Weekly progress
    results.append(("Weekly Progress", test_weekly_progress()))
    
    # Test 8: Database persistence
    results.append(("Database Persistence", test_database_persistence()))
    
    # Summary
    print("\n" + "="*70)
    print("📊 Test Summary")
    print("="*70)
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for name, passed in results:
        status = "✅" if passed else "❌"
        print(f"{status} {name}")
    
    print(f"\n🎯 Results: {passed_count}/{total_count} tests passed ({passed_count*100//total_count}%)")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed! Backend is fully functional!")
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed. Check details above.")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    print("\n⏳ Waiting for server to be ready...")
    import time
    time.sleep(2)
    main()
