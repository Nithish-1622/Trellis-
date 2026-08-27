"""Main FastAPI application for Career Mentor API."""
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import uuid

from config import settings
from database import init_db, get_db, UserProfile
from schemas import (
    AgentMessageRequest, AgentMessageResponse,
    RoadmapRegenerateRequest,
    MilestoneCompleteRequest,
    ApplicationOutcomeRequest,
    MemorySummary,
    WeeklyProgress,
    HealthResponse,
    ResumeParseResponse,
    JobRecommendationRequest,
    JobRecommendationResponse,
    MarketTrendsRequest,
    MarketTrendsResponse,
    LearningResourcesRequest,
    LearningResource,
    InterviewSessionRequest,
    InterviewInteractionResponse,
    InterviewAnswerRequest,
    InterviewFinalReport
)
from services import CareerMentorService
from resume_parser import resume_parser
from job_recommender import job_engine
from learning_resources import learning_resources
from interview_agent import get_interview_agent

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Agentic AI Career Mentor Backend - LangGraph + FastAPI",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting Career Mentor API...")
    init_db()
    logger.info("Database initialized")


def ensure_user_profile(db: Session, user_id: str) -> UserProfile:
    """
    Ensure user profile exists, create if not found.
    
    Args:
        db: Database session
        user_id: User identifier
    
    Returns:
        UserProfile instance
    """
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()
    
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            skills=[],
            career_goals=[],
            target_role=None
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        logger.info(f"Created new user profile for {user_id}")
    
    return profile


# Health check
@app.get("/", response_model=HealthResponse)
async def health_check():
    """API health check endpoint."""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow()
    )


# ============== Protected Endpoints ==============
# All endpoints expect user_id in request body (from frontend auth)

@app.post("/agent/message", response_model=AgentMessageResponse)
async def agent_message(
    request: AgentMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Main agent conversation endpoint.
    
    Frontend should verify user authentication and pass user_id.
    """
    try:
        service = CareerMentorService(db)
        result = await service.process_message(
            user_id=request.user_id,
            message=request.message,
            context=request.context
        )
        
        return AgentMessageResponse(**result)
    
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agent/memory/summary")
async def get_memory_summary(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's long-term memory summary."""
    try:
        service = CareerMentorService(db)
        summary = await service.get_memory_summary(user_id)
        
        return summary
    
    except Exception as e:
        logger.error(f"Error fetching memory summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agent/roadmap/current")
async def get_current_roadmap(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's current active roadmap."""
    try:
        service = CareerMentorService(db)
        roadmap = await service.get_current_roadmap(user_id)
        
        if not roadmap:
            raise HTTPException(status_code=404, detail="No active roadmap found")
        
        return roadmap
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/roadmap/regenerate")
async def regenerate_roadmap(
    request: RoadmapRegenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate a new personalized roadmap."""
    try:
        # Ensure user profile exists
        ensure_user_profile(db, request.user_id)
        
        service = CareerMentorService(db)
        roadmap = await service.regenerate_roadmap(
            user_id=request.user_id,
            target_role=request.target_role,
            focus_areas=request.focus_areas,
            timeline_weeks=request.timeline_weeks or 12
        )
        
        return roadmap
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error regenerating roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/milestone/complete")
async def complete_milestone(
    request: MilestoneCompleteRequest,
    db: Session = Depends(get_db)
):
    """Mark a milestone as completed."""
    try:
        service = CareerMentorService(db)
        success = await service.complete_milestone(
            user_id=request.user_id,
            milestone_id=request.milestone_id,
            reflection=request.reflection,
            learned_skills=request.learned_skills
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        return {"success": True, "message": "Milestone completed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing milestone: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/application/outcome")
async def log_application_outcome(
    request: ApplicationOutcomeRequest,
    db: Session = Depends(get_db)
):
    """Log job application outcome for learning."""
    try:
        # Ensure user profile exists
        ensure_user_profile(db, request.user_id)
        
        service = CareerMentorService(db)
        app_id = await service.log_application_outcome(
            user_id=request.user_id,
            company=request.company,
            position=request.position,
            status=request.status.value,
            feedback=request.feedback,
            interview_topics=request.interview_topics,
            applied_date=request.applied_date
        )
        
        return {
            "success": True,
            "application_id": app_id,
            "message": "Application outcome logged successfully"
        }
    
    except Exception as e:
        logger.error(f"Error logging application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agent/progress/weekly", response_model=WeeklyProgress)
async def get_weekly_progress(
    user_id: str,
    week_offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get weekly progress summary.
    
    Args:
        user_id: User identifier
        week_offset: Weeks back from current (0 = this week, 1 = last week)
    """
    try:
        service = CareerMentorService(db)
        progress = await service.get_weekly_progress(user_id, week_offset)
        
        return WeeklyProgress(**progress)
    
    except Exception as e:
        logger.error(f"Error fetching weekly progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )

# ============== NEW: High Priority Features ==============

@app.post("/agent/resume/parse", response_model=ResumeParseResponse)
async def parse_resume(
    user_id: str,
    file: UploadFile = File(...),
    resume_file_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Parse resume and extract structured information.
    
    Accepts PDF or DOCX files.
    """
    try:
        from resume_parser import resume_parser
        
        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: PDF, DOCX. Got: {file.content_type}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Parse resume
        parsed_data = await resume_parser.parse_resume(file_content, file.content_type)
        
        # Ensure user profile exists
        ensure_user_profile(db, user_id)
        
        # Update user profile with extracted skills and resume info
        profile_update = {}
        
        if parsed_data.get('skills'):
            # Overwrite skills with new data from resume
            new_skills_list = [
                {"name": skill, "level": "intermediate", "verified": True}
                for skill in parsed_data['skills']
            ]
            profile_update["skills"] = new_skills_list
            
            # Infer best fit role if not set
            current_profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if not current_profile or not current_profile.target_role:
                from graph.tools import get_tools
                tools = get_tools(db)
                # Temporarily save skills to infer role
                current_profile.skills = new_skills_list
                db.commit() 
                
                best_fit_role = await tools.infer_best_fit_role(user_id)
                profile_update["target_role"] = best_fit_role
            
        # Update resume info if file_id provided
        if resume_file_id:
            profile_update["resume_filename"] = file.filename
            profile_update["resume_file_id"] = resume_file_id
            
        if profile_update:
            db.query(UserProfile).filter(UserProfile.user_id == user_id).update(
                profile_update,
                synchronize_session=False
            )
            db.commit()
        
        logger.info(f"Successfully parsed resume for user {user_id}")
        return parsed_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/jobs/recommend")
async def recommend_jobs(
    request: JobRecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Get personalized job recommendations based on user profile.
    
    Analyzes skills, experience, and career goals to match relevant opportunities.
    """
    try:
        from job_recommender import job_engine
        
        jobs = await job_engine.recommend_jobs(
            db=db,
            user_id=request.user_id,
            limit=request.limit
        )
        
        if not jobs:
            raise HTTPException(
                status_code=404,
                detail="No job recommendations found. Please update your profile."
            )
        
        return {
            "user_id": request.user_id,
            "total_recommendations": len(jobs),
            "jobs": jobs,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating job recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/market/trends", response_model=MarketTrendsResponse)
async def analyze_market_trends(
    request: MarketTrendsRequest
):
    """
    Analyze current job market trends for a specific role.
    
    Provides insights on demand, salary, top skills, and hiring trends.
    """
    try:
        from job_recommender import job_engine
        
        trends = await job_engine.analyze_market_trends(
            role=request.role,
            location=request.location
        )
        
        return trends
    
    except Exception as e:
        logger.error(f"Error analyzing market trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/resources/learning")
async def get_learning_resources(
    request: LearningResourcesRequest
):
    """
    Get personalized learning resources for a skill.
    
    Returns courses, tutorials, videos, and project ideas.
    """
    try:
        from learning_resources import learning_resources
        
        resources = await learning_resources.get_resources_for_skill(
            skill=request.skill,
            level=request.level.value,
            resource_types=request.resource_types if request.resource_types else None
        )
        
        return {
            "skill": request.skill,
            "level": request.level,
            "total_resources": len(resources),
            "resources": resources,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error fetching learning resources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== AI Mock Interviewer Endpoints ==============

@app.post("/agent/interview/start", response_model=InterviewInteractionResponse)
async def start_interview(
    request: InterviewSessionRequest,
    db: Session = Depends(get_db)
):
    """Start a new AI mock interview session."""
    try:
        agent = get_interview_agent(db)
        return await agent.start_session(request)
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/interview/submit", response_model=InterviewInteractionResponse)
async def submit_interview_answer(
    request: InterviewAnswerRequest,
    db: Session = Depends(get_db)
):
    """Submit an answer and get feedback/next question."""
    try:
        agent = get_interview_agent(db)
        return await agent.submit_answer(request.session_id, request.answer)
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/interview/report/{session_id}", response_model=InterviewFinalReport)
async def get_interview_report(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get final report for a completed session."""
    try:
        agent = get_interview_agent(db)
        return await agent.generate_final_report(session_id)
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
