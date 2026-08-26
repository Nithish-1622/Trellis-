"""Service layer for business logic."""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from database import UserProfile, Milestone, Application, Roadmap
from graph import create_career_graph
from memory import memory_manager
from schemas import (
    MilestoneStatus, ApplicationStatus,
    Milestone as MilestoneSchema,
    Roadmap as RoadmapSchema
)


class CareerMentorService:
    """Business logic for career mentor operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.graph = create_career_graph(db)
    
    async def process_message(
        self,
        user_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process user message through the agent.
        
        Args:
            user_id: User identifier
            message: User's message
            context: Optional context
        
        Returns:
            Agent response
        """
        return await self.graph.run(user_id, message, context)
    
    async def get_memory_summary(self, user_id: str) -> Dict[str, Any]:
        """Get user's memory summary."""
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            return {
                "skills": [],
                "career_goals": [],
                "total_applications": 0,
                "completed_milestones": 0,
                "current_focus": None,
                "last_activity": None
            }
        
        completed_milestones = self.db.query(Milestone).filter(
            Milestone.user_id == user_id,
            Milestone.status == MilestoneStatus.COMPLETED.value
        ).count()
        
        total_applications = self.db.query(Application).filter(
            Application.user_id == user_id
        ).count()
        
        # Consolidate memories
        memory_insights = await memory_manager.consolidate_memories(self.db, user_id)
        
        return {
            "skills": profile.skills or [],
            "career_goals": profile.career_goals or [],
            "total_applications": total_applications,
            "completed_milestones": completed_milestones,
            "current_focus": profile.target_role,
            "resume_filename": profile.resume_filename,
            "resume_file_id": profile.resume_file_id,
            "last_activity": profile.updated_at,
            "memory_insights": memory_insights
        }
    
    async def get_current_roadmap(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's active roadmap."""
        roadmap = self.db.query(Roadmap).filter(
            Roadmap.user_id == user_id,
            Roadmap.is_active == True
        ).order_by(Roadmap.generated_at.desc()).first()
        
        if not roadmap:
            return None
        
        # Get associated milestones
        milestones = self.db.query(Milestone).filter(
            Milestone.roadmap_id == roadmap.id
        ).all()
        
        return {
            "id": roadmap.id,
            "target_role": roadmap.target_role,
            "skill_gaps": roadmap.skill_gaps,
            "milestones": [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "status": m.status,
                    "skills_to_learn": m.skills_to_learn,
                    "estimated_hours": m.estimated_hours,
                    "deadline": m.deadline.isoformat() if m.deadline else None,
                    "resources": m.resources
                }
                for m in milestones
            ],
            "estimated_completion_weeks": roadmap.estimated_completion_weeks,
            "generated_at": roadmap.generated_at.isoformat(),
            "last_updated": roadmap.last_updated.isoformat()
        }
    
    async def regenerate_roadmap(
        self,
        user_id: str,
        target_role: Optional[str] = None,
        focus_areas: Optional[List[str]] = None,
        timeline_weeks: int = 12
    ) -> Dict[str, Any]:
        """
        Generate a new roadmap for the user.
        
        Args:
            user_id: User identifier
            target_role: Optional target role (uses profile default if not provided)
            focus_areas: Optional specific areas to focus on
            timeline_weeks: Timeline in weeks
        
        Returns:
            Generated roadmap
        """
        # Get user profile
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            raise ValueError("User profile not found")
        
        # Get tools (needed for inference and skill gaps)
        from graph.tools import get_tools
        tools = get_tools(self.db)
        
        # Use provided target role or profile default, otherwise infer dynamically
        role = target_role or profile.target_role
        if not role:
            role = await tools.infer_best_fit_role(user_id)
        
        # Deactivate old roadmaps
        self.db.query(Roadmap).filter(
            Roadmap.user_id == user_id,
            Roadmap.is_active == True
        ).update({"is_active": False})
        
        # Get skill gaps using LLM
        skill_gaps = await tools.get_skill_gaps(user_id, role)
        
        # Generate milestones using LLM for detailed plan
        roadmap_plan = await tools.generate_roadmap_plan(role, skill_gaps, timeline_weeks)
        
        milestones = []
        for i, item in enumerate(roadmap_plan):
            milestone_id = str(uuid.uuid4())
            milestone = Milestone(
                id=milestone_id,
                user_id=user_id,
                title=item.get("title", f"Milestone {i+1}"),
                description=item.get("description", "Complete the assigned tasks."),
                status=MilestoneStatus.NOT_STARTED.value,
                skills_to_learn=item.get("skills", []),
                estimated_hours=item.get("estimated_hours", 20),
                deadline=datetime.utcnow() + timedelta(weeks=(i+1) * 2),
                resources=[]
            )
            milestones.append(milestone)
        
        # Create roadmap
        roadmap_id = str(uuid.uuid4())
        roadmap = Roadmap(
            id=roadmap_id,
            user_id=user_id,
            target_role=role,
            skill_gaps=skill_gaps,
            estimated_completion_weeks=timeline_weeks,
            is_active=True,
            full_plan={}
        )
        
        # Save to database
        self.db.add(roadmap)
        for milestone in milestones:
            milestone.roadmap_id = roadmap_id
            self.db.add(milestone)
        
        self.db.commit()
        
        # Add memory
        await memory_manager.add_memory(
            self.db,
            user_id=user_id,
            content=f"Generated new roadmap for {role} role with {len(skill_gaps)} skill gaps",
            memory_type="semantic",
            importance=0.9,
            tags=["roadmap", "planning"]
        )
        
        return await self.get_current_roadmap(user_id)
    
    async def complete_milestone(
        self,
        user_id: str,
        milestone_id: str,
        reflection: Optional[str] = None,
        learned_skills: Optional[List[str]] = None
    ) -> bool:
        """
        Mark a milestone as completed.
        
        Args:
            user_id: User identifier
            milestone_id: Milestone ID
            reflection: Optional reflection text
            learned_skills: Skills learned
        
        Returns:
            Success boolean
        """
        milestone = self.db.query(Milestone).filter(
            Milestone.id == milestone_id,
            Milestone.user_id == user_id
        ).first()
        
        if not milestone:
            return False
        
        # Update milestone
        milestone.status = MilestoneStatus.COMPLETED.value
        milestone.completed_at = datetime.utcnow()
        if reflection:
            milestone.reflection = reflection
        
        # Update user skills
        if learned_skills:
            profile = self.db.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if profile:
                current_skills = profile.skills or []
                for skill in learned_skills:
                    # Add or update skill
                    existing = next(
                        (
                            s
                            for s in current_skills
                            if isinstance(s, dict)
                            and s.get("name", "").lower() == skill.lower()
                        ),
                        None,
                    )
                    if existing:
                        existing['last_used'] = datetime.utcnow().isoformat()
                    else:
                        current_skills.append({
                            "name": skill,
                            "level": "beginner",
                            "last_used": datetime.utcnow().isoformat()
                        })
                
                profile.skills = current_skills
        
        self.db.commit()
        
        # Save to memory
        await memory_manager.add_memory(
            self.db,
            user_id=user_id,
            content=f"Completed milestone: {milestone.title}. Reflection: {reflection or 'None'}",
            memory_type="feedback",
            importance=0.8,
            tags=["milestone", "achievement"]
        )
        
        return True
    
    async def log_application_outcome(
        self,
        user_id: str,
        company: str,
        position: str,
        status: str,
        feedback: Optional[str] = None,
        interview_topics: Optional[List[str]] = None,
        applied_date: Optional[datetime] = None
    ) -> str:
        """
        Log a job application outcome.
        
        Args:
            user_id: User identifier
            company: Company name
            position: Position title
            status: Application status
            feedback: Optional feedback
            interview_topics: Topics discussed in interview
            applied_date: Application date
        
        Returns:
            Application ID
        """
        app_id = str(uuid.uuid4())
        
        application = Application(
            id=app_id,
            user_id=user_id,
            company=company,
            position=position,
            status=status,
            applied_date=applied_date or datetime.utcnow(),
            feedback=feedback,
            interview_topics=interview_topics or []
        )
        
        self.db.add(application)
        self.db.commit()
        
        # Save to memory with high importance if rejected (to learn from)
        importance = 0.9 if status == ApplicationStatus.REJECTED.value else 0.6
        
        await memory_manager.add_memory(
            self.db,
            user_id=user_id,
            content=f"Application to {company} for {position}: {status}. Feedback: {feedback or 'None'}",
            memory_type="feedback",
            importance=importance,
            tags=["application", status]
        )
        
        return app_id
    
    async def get_weekly_progress(
        self,
        user_id: str,
        week_offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get weekly progress summary.
        
        Args:
            user_id: User identifier
            week_offset: Weeks back from current (0 = current week)
        
        Returns:
            Weekly progress data
        """
        # Calculate week boundaries
        today = datetime.utcnow()
        week_start = today - timedelta(days=today.weekday() + (week_offset * 7))
        week_end = week_start + timedelta(days=7)
        
        # Get completed milestones this week
        completed = self.db.query(Milestone).filter(
            Milestone.user_id == user_id,
            Milestone.status == MilestoneStatus.COMPLETED.value,
            Milestone.completed_at >= week_start,
            Milestone.completed_at < week_end
        ).all()
        
        # Get applications this week
        applications = self.db.query(Application).filter(
            Application.user_id == user_id,
            Application.applied_date >= week_start,
            Application.applied_date < week_end
        ).all()
        
        # Calculate insights
        new_skills = []
        for milestone in completed:
            new_skills.extend(milestone.skills_to_learn)
        
        total_hours = sum(m.actual_hours or m.estimated_hours for m in completed)
        
        interviews = len([a for a in applications if a.status in [
            ApplicationStatus.INTERVIEW.value,
            ApplicationStatus.SCREENING.value
        ]])
        
        return {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "milestones_completed": len(completed),
            "new_skills_learned": list(set(new_skills)),
            "applications_submitted": len(applications),
            "interviews_attended": interviews,
            "total_hours_invested": total_hours,
            "achievements": [m.title for m in completed],
            "next_week_goals": ["Continue learning", "Apply to 3+ positions", "Complete next milestone"]
        }
