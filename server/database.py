"""Database models for persistent storage."""
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import settings

Base = declarative_base()


class UserProfile(Base):
    """Core user profile with career data."""
    __tablename__ = "user_profiles"
    
    user_id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Career basics
    current_role = Column(String, nullable=True)
    target_role = Column(String, nullable=True)
    experience_years = Column(Float, default=0)
    education_level = Column(String, nullable=True)
    
    # Resume Data
    resume_filename = Column(String, nullable=True)
    resume_file_id = Column(String, nullable=True)
    
    # JSON fields for complex data
    skills = Column(JSON, default=list)  # List[{name, level, last_used}]
    career_goals = Column(JSON, default=list)  # List[{target_role, timeline, priority}]
    interests = Column(JSON, default=list)
    
    # Relationships
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")


class Memory(Base):
    """Episodic & semantic memory entries."""
    __tablename__ = "memories"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    memory_type = Column(String)  # episodic, semantic, feedback
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)  # Vector embedding for semantic search
    
    # Metadata
    importance = Column(Float, default=0.5)  # 0-1 score
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)  # Renamed from metadata to avoid SQLAlchemy conflict
    
    user = relationship("UserProfile", back_populates="memories")


class Milestone(Base):
    """Roadmap milestones."""
    __tablename__ = "milestones"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    roadmap_id = Column(String, ForeignKey("roadmaps.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="not_started")
    
    skills_to_learn = Column(JSON, default=list)
    estimated_hours = Column(Integer)
    actual_hours = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    deadline = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    resources = Column(JSON, default=list)
    reflection = Column(Text, nullable=True)
    
    user = relationship("UserProfile", back_populates="milestones")
    roadmap = relationship("Roadmap", back_populates="milestones")


class Application(Base):
    """Job application tracking."""
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, default="applied")
    
    applied_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    url = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    interview_topics = Column(JSON, default=list)
    
    match_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    user = relationship("UserProfile", back_populates="applications")


class Roadmap(Base):
    """Generated skill roadmaps."""
    __tablename__ = "roadmaps"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    
    target_role = Column(String, nullable=False)
    skill_gaps = Column(JSON, default=list)
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    estimated_completion_weeks = Column(Integer)
    is_active = Column(Boolean, default=True)
    
    full_plan = Column(JSON)  # Complete roadmap data
    
    user = relationship("UserProfile", back_populates="roadmaps")
    milestones = relationship("Milestone", back_populates="roadmap", cascade="all, delete-orphan")


# Database setup
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
