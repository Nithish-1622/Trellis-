"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SkillLevel(str, Enum):
    """Skill proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class ApplicationStatus(str, Enum):
    """Job application status."""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


class MilestoneStatus(str, Enum):
    """Milestone completion status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


# ============== Request Models ==============

class AgentMessageRequest(BaseModel):
    """Request for agent conversation."""
    user_id: str = Field(..., description="Authenticated user ID")
    message: str = Field(..., min_length=1, max_length=5000)
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")


class RoadmapRegenerateRequest(BaseModel):
    """Request to regenerate roadmap."""
    user_id: str
    target_role: Optional[str] = None
    focus_areas: Optional[List[str]] = None
    timeline_weeks: Optional[int] = Field(default=12, ge=4, le=52)


class MilestoneCompleteRequest(BaseModel):
    """Request to mark milestone complete."""
    user_id: str
    milestone_id: str
    reflection: Optional[str] = Field(default=None, max_length=2000)
    learned_skills: Optional[List[str]] = None


class ApplicationOutcomeRequest(BaseModel):
    """Request to log application outcome."""
    user_id: str
    company: str
    position: str
    status: ApplicationStatus
    feedback: Optional[str] = None
    interview_topics: Optional[List[str]] = None
    applied_date: Optional[datetime] = None


class ResumeUploadRequest(BaseModel):
    """Request for resume parsing."""
    user_id: str
    resume_file_id: Optional[str] = Field(default=None, description="Appwrite File ID")
    file_type: str = Field(..., description="File type: pdf or docx")


class JobRecommendationRequest(BaseModel):
    """Request for job recommendations."""
    user_id: str
    limit: int = Field(default=10, ge=1, le=50)
    location: Optional[str] = Field(default="Remote")


class MarketTrendsRequest(BaseModel):
    """Request for market trends analysis."""
    role: str = Field(..., description="Job role to analyze")
    location: str = Field(default="Remote")


class LearningResourcesRequest(BaseModel):
    """Request for learning resources."""
    skill: str = Field(..., description="Skill to learn")
    level: SkillLevel = Field(default=SkillLevel.BEGINNER)
    resource_types: Optional[List[str]] = Field(default=None)


# ============== Response Models ==============

class Skill(BaseModel):
    """Individual skill model."""
    name: str
    level: SkillLevel
    last_used: Optional[datetime] = None
    verified: bool = False


class CareerGoal(BaseModel):
    """Career goal model."""
    target_role: str
    target_companies: Optional[List[str]] = None
    timeline_months: int
    priority: int = 1


class Milestone(BaseModel):
    """Roadmap milestone."""
    id: str
    title: str
    description: str
    skills_to_learn: List[str]
    estimated_hours: int
    status: MilestoneStatus
    deadline: Optional[datetime] = None
    resources: List[str] = []
    completed_at: Optional[datetime] = None


class Roadmap(BaseModel):
    """Complete skill roadmap."""
    target_role: str
    skill_gaps: List[str]
    milestones: List[Milestone]
    estimated_completion_weeks: int
    generated_at: datetime
    last_updated: datetime


class JobRecommendation(BaseModel):
    """Job recommendation."""
    title: str
    company: str
    match_score: float = Field(..., ge=0, le=1)
    matching_skills: List[str]
    missing_skills: List[str]
    url: Optional[str] = None
    reasoning: str


class MemorySummary(BaseModel):
    """User memory summary."""
    skills: List[Skill]
    career_goals: List[CareerGoal]
    total_applications: int
    completed_milestones: int
    current_focus: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_file_id: Optional[str] = None
    last_activity: datetime


class AgentMessageResponse(BaseModel):
    """Response from agent conversation."""
    response: str
    suggestions: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class WeeklyProgress(BaseModel):
    """Weekly progress summary."""
    week_start: datetime
    week_end: datetime
    milestones_completed: int
    new_skills_learned: List[str]
    applications_submitted: int
    interviews_attended: int
    total_hours_invested: float
    achievements: List[str]
    next_week_goals: List[str]


class ResumeParseResponse(BaseModel):
    """Response from resume parsing."""
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: List[str]
    certifications: List[str]
    projects: List[Dict[str, Any]]
    parsed_at: str


class JobRecommendationResponse(BaseModel):
    """Job recommendation response."""
    company: str
    title: str
    location: str
    job_type: str
    match_score: int
    required_skills: List[str]
    salary_range: Dict[str, Any]
    description: str
    url: str
    recommendation_reason: str


class MarketTrendsResponse(BaseModel):
    """Market trends analysis response."""
    role: str
    location: str
    demand_level: str
    salary_range: Dict[str, Any]
    top_skills: List[str]
    growth_trajectory: str
    top_companies: List[str]
    remote_percentage: int
    entry_level_opportunities: str
    key_trends: List[str]


class LearningResource(BaseModel):
    """Learning resource model."""
    title: str
    type: str
    platform: str
    url: str
    duration: str
    topics: List[str]
    prerequisites: List[str]
    difficulty: str


# ============== Health Check ==============

class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    version: str
    timestamp: datetime


# ============== Mock Interview Schemas ==============

class InterviewSessionRequest(BaseModel):
    user_id: str
    target_role: str
    focus_area: Optional[str] = "General"
    difficulty: str = "intermediate"

class InterviewInteractionResponse(BaseModel):
    session_id: str
    question: str
    question_type: str
    previous_feedback: Optional[str] = None
    previous_score: Optional[int] = None
    state: str = "in_progress"

class InterviewAnswerRequest(BaseModel):
    user_id: str
    session_id: str
    answer: str

class InterviewFinalReport(BaseModel):
    session_id: str
    user_id: str
    role: str
    overall_score: int
    strengths: List[str]
    improvements: List[str]
    summary: str
    transcript: List[Dict[str, str]]

