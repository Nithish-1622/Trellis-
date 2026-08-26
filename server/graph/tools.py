"""Agent tools for interacting with memory, data, and external systems."""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session

from langchain.tools import tool
from langchain_groq import ChatGroq

from database import UserProfile, Milestone, Application, Roadmap
from memory import memory_manager
from config import settings


class CareerMentorTools:
    """Tools available to the career mentor agent."""
    
    def __init__(self, db: Session):
        self.db = db
        self.llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7
        )

    async def infer_best_fit_role(self, user_id: str) -> str:
        """
        Infer the best fit role based on user profile using LLM.
        
        Args:
            user_id: User identifier
            
        Returns:
            Inferred role title
        """
        try:
            profile = await self.read_user_profile(user_id)
            current_skills = profile.get('skills', [])
            skill_names = [s['name'] if isinstance(s, dict) else s for s in current_skills]
            
            if not skill_names:
                return "Entry Level Software Engineer"
                
            prompt = f"""Based on these technical skills: {', '.join(skill_names)}
            
            Determine the single best fitting specific job role title (e.g., "Frontend Developer", "Data Scientist", "DevOps Engineer").
            Return ONLY the role title string. No explanation."""
            
            response = await self.llm.ainvoke(prompt)
            role = response.content.strip().replace('"', '').replace("'", "")
            return role
            
        except Exception as e:
            print(f"Error inferring role: {e}")
            return "Software Engineer"
    
    async def read_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Read complete user profile including skills, goals, and progress.
        
        Args:
            user_id: User identifier
        
        Returns:
            Dictionary with user profile data
        """
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            # Create new profile
            profile = UserProfile(user_id=user_id)
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)
        
        return {
            "user_id": profile.user_id,
            "current_role": profile.current_role,
            "target_role": profile.target_role,
            "experience_years": profile.experience_years,
            "skills": profile.skills or [],
            "career_goals": profile.career_goals or [],
            "interests": profile.interests or []
        }
    
    async def update_user_skills(
        self,
        user_id: str,
        skills: List[Dict[str, Any]]
    ) -> bool:
        """
        Update user's skill set.
        
        Args:
            user_id: User identifier
            skills: List of skill objects with name, level
        
        Returns:
            Success boolean
        """
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if profile:
            profile.skills = skills
            profile.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
    
    async def get_skill_gaps(
        self,
        user_id: str,
        target_role: str
    ) -> List[str]:
        """
        Analyze skill gaps for a target role using LLM.
        
        Args:
            user_id: User identifier
            target_role: Target job role
        
        Returns:
            List of missing skills
        """
        profile = await self.read_user_profile(user_id)
        current_skills = profile.get('skills', [])
        # Extract skill names if they are dicts
        skill_names = [s['name'] if isinstance(s, dict) else s for s in current_skills]
        
        # 1. Try LLM for dynamic analysis
        try:
            prompt = f"""Analyze the skill gaps for a user targeting the role of '{target_role}'.
            
            User's Current Skills: {', '.join(skill_names) if skill_names else 'None listed'}
            
            Current Job Market Context: Late 2024/2025.
            
            Identify the top 5-7 most critical missing skills or technologies this user needs to learn to be a competitive candidate for a {target_role} position.
            Focus on technical skills, tools, and frameworks.
            
            Return ONLY a valid JSON array of strings, e.g., ["Skill 1", "Skill 2"]. Do not include any other text or markdown formatting."""
            
            response = await self.llm.ainvoke(prompt)
            content = response.content.strip()
            
            # Clean up potential markdown formatting
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            
            skill_gaps = json.loads(content.strip())
            
            if isinstance(skill_gaps, list) and len(skill_gaps) > 0:
                # Filter out skills user already has (simple string matching)
                current_skills_lower = {s.lower() for s in skill_names}
                final_gaps = [
                    skill for skill in skill_gaps 
                    if skill.lower() not in current_skills_lower
                ]
                # If LLM returns all skills user has (unlikely), return original list or top 3
                return final_gaps if final_gaps else skill_gaps[:3]

        except Exception as e:
            print(f"LLM skill gap analysis failed: {e}")
            # Fall through to static dictionary
            
        # 2. Fallback to static dictionary
        current_skills_set = {s.lower() for s in skill_names}
        
        # Role-specific skill requirements (2025 market)
        role_requirements = {
            "software engineer": [
                "data structures", "algorithms", "system design",
                "git", "testing", "ci/cd", "cloud platforms"
            ],
            "frontend developer": [
                "react", "typescript", "html/css", "responsive design",
                "state management", "testing", "performance optimization"
            ],
            "backend developer": [
                "rest api", "databases", "authentication", "caching",
                "microservices", "docker", "kubernetes"
            ],
            "backend engineer": [
                "rest api", "databases", "authentication", "caching",
                "microservices", "docker", "kubernetes"
            ],
            "fullstack developer": [
                "react", "node.js", "databases", "rest api",
                "docker", "ci/cd", "system design"
            ],
            "data scientist": [
                "python", "pandas", "scikit-learn", "sql",
                "statistics", "ml algorithms", "data visualization"
            ],
            "ml engineer": [
                "python", "tensorflow/pytorch", "mlops", "docker",
                "model deployment", "distributed training", "monitoring"
            ],
            "devops engineer": [
                "kubernetes", "docker", "ci/cd", "infrastructure as code",
                "monitoring", "cloud platforms", "scripting"
            ]
        }
        
        required = role_requirements.get(target_role.lower(), [])
        # If no exact match, try to find similar roles
        if not required:
            for key in role_requirements:
                if key in target_role.lower() or target_role.lower() in key:
                    required = role_requirements[key]
                    break
        
        gaps = [skill for skill in required if skill not in current_skills_set]
        
        return gaps
    
    async def generate_roadmap_plan(
        self,
        role: str,
        skill_gaps: List[str],
        timeline_weeks: int
    ) -> List[Dict[str, Any]]:
        """
        Generate detailed, actionable milestones for a roadmap.
        
        Args:
           role: Target role
           skill_gaps: List of skills to learn
           timeline_weeks: Total timeline
           
        Returns:
           List of milestone dictionaries with title, description, and details
        """
        prompt = f"""Create a {timeline_weeks}-week learning roadmap for a {role}.
        The user specifically needs to learn these skills: {', '.join(skill_gaps)}.
        
        Create 5 distinct milestones that logically progress from foundational to advanced.
        
        For each milestone, provide:
        - title: A specific, action-oriented title (NOT just "Master X"). E.g., "Build a REST API with FastAPI" or "Deploying Microservices on AWS".
        - description: A detailed 1-sentence description of what they will achieve.
        - skills: specific sub-skills or topics covered in this milestone.
        - estimated_hours: realistic hours to complete.
        
        Return ONLY a valid JSON array of objects. Example:
        [
            {{
                "title": "...",
                "description": "...",
                "skills": ["..."],
                "estimated_hours": 20
            }}
        ]"""
        
        try:
            response = await self.llm.ainvoke(prompt)
            content = response.content.strip()
             # Clean up potential markdown formatting
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
                
            plan = json.loads(content.strip())
            return plan
        except Exception as e:
            print(f"Error generating roadmap plan: {e}")
            # Fallback to simple generation if LLM fails
            return [
                {
                    "title": f"Learn {skill}",
                    "description": f"Focus on mastering {skill} concepts and building a small project.",
                    "skills": [skill],
                    "estimated_hours": 20
                }
                for skill in skill_gaps[:5]
            ]
    async def analyze_market_trends(
        self,
        role: str,
        location: str = "Remote"
    ) -> Dict[str, Any]:
        """
        Analyze current job market trends for a role (mock/simplified).
        
        Args:
            role: Job role to analyze
            location: Job location
        
        Returns:
            Market analysis data
        """
        # Mock market data - in production, integrate with real APIs
        return {
            "role": role,
            "demand_level": "high",
            "avg_salary_range": "$80k - $150k",
            "top_skills_2025": [
                "AI/ML integration",
                "Cloud platforms (AWS/Azure)",
                "System design",
                "Performance optimization"
            ],
            "trending_technologies": [
                "LangChain/LangGraph",
                "Vector databases",
                "Real-time systems"
            ],
            "advice": f"Strong demand for {role} roles. Focus on hands-on projects and system design."
        }
    
    async def generate_project_ideas(
        self,
        skills_to_learn: List[str],
        difficulty: str = "intermediate"
    ) -> List[Dict[str, Any]]:
        """
        Generate project ideas to learn specific skills.
        
        Args:
            skills_to_learn: Target skills
            difficulty: Project difficulty level
        
        Returns:
            List of project suggestions
        """
        prompt = f"""Generate 3 practical project ideas to learn these skills: {', '.join(skills_to_learn)}
        
        Difficulty: {difficulty}
        
        For each project, provide:
        - Name
        - Description (2-3 sentences)
        - Key skills practiced
        - Estimated hours
        
        Format as JSON array."""
        
        response = await self.llm.ainvoke(prompt)
        
        try:
            # Parse LLM response
            projects = json.loads(response.content)
            return projects
        except (json.JSONDecodeError, TypeError, ValueError):
            # Fallback projects
            return [
                {
                    "name": f"Practical {skills_to_learn[0]} Project",
                    "description": f"Build a real-world application using {skills_to_learn[0]}",
                    "skills": skills_to_learn[:3],
                    "estimated_hours": 20
                }
            ]
    
    async def find_learning_resources(
        self,
        skill: str
    ) -> List[Dict[str, str]]:
        """
        Find learning resources for a skill.
        
        Args:
            skill: Skill to learn
        
        Returns:
            List of resource recommendations
        """
        # Curated resources (expandable with APIs)
        resources_db = {
            "react": [
                {"type": "docs", "name": "React Official Docs", "url": "https://react.dev"},
                {"type": "course", "name": "Frontend Masters React", "url": "https://frontendmasters.com"},
                {"type": "practice", "name": "React Challenges", "url": "https://github.com/topics/react-challenges"}
            ],
            "python": [
                {"type": "docs", "name": "Python.org Tutorial", "url": "https://docs.python.org/3/tutorial/"},
                {"type": "practice", "name": "LeetCode Python", "url": "https://leetcode.com"},
                {"type": "book", "name": "Fluent Python", "url": "https://www.oreilly.com"}
            ],
            "system design": [
                {"type": "course", "name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"},
                {"type": "book", "name": "Designing Data-Intensive Applications", "url": "https://dataintensive.net"},
                {"type": "practice", "name": "System Design Interview", "url": "https://www.designgurus.io"}
            ]
        }
        
        return resources_db.get(skill.lower(), [
            {"type": "search", "name": f"Search '{skill} tutorial'", "url": f"https://www.google.com/search?q={skill}+tutorial"}
        ])
    
    async def get_recent_applications(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recent job applications."""
        apps = self.db.query(Application).filter(
            Application.user_id == user_id
        ).order_by(Application.applied_date.desc()).limit(limit).all()
        
        return [
            {
                "company": app.company,
                "position": app.position,
                "status": app.status,
                "applied_date": app.applied_date.isoformat(),
                "feedback": app.feedback
            }
            for app in apps
        ]


def get_tools(db: Session) -> CareerMentorTools:
    """Factory function to create tools instance."""
    return CareerMentorTools(db)
