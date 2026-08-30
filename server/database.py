"""Database models for persistent storage."""
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, JSON, Text, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from sqlalchemy.orm import declarative_base
from config import settings

Base = declarative_base()


class AppUser(Base):
    """Application identity synchronized from a validated Appwrite account."""
    __tablename__ = "app_users"

    user_id = Column(String, primary_key=True)
    email = Column(String, nullable=False, default="")
    name = Column(String, nullable=False, default="")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    onboarding_session = relationship(
        "OnboardingSession", back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class UserRole(Base):
    """Persisted application role for an authenticated user."""
    __tablename__ = "user_roles"

    user_id = Column(String, ForeignKey("app_users.user_id", ondelete="CASCADE"), primary_key=True)
    role = Column(String, primary_key=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="roles")


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
    objective = Column(Text, nullable=True)
    target_date = Column(DateTime, nullable=True)
    
    # Resume Data
    resume_filename = Column(String, nullable=True)
    resume_file_id = Column(String, nullable=True)
    
    # JSON fields for complex data
    skills = Column(JSON, default=list)  # List[{name, level, last_used}]
    career_goals = Column(JSON, default=list)  # List[{target_role, timeline, priority}]
    interests = Column(JSON, default=list)
    preferred_formats = Column(JSON, default=list)
    project_theory_balance = Column(Integer, nullable=True)
    learning_pace = Column(String, nullable=True)
    weekly_hours = Column(Float, nullable=True)
    preferred_language = Column(String, nullable=True)
    budget = Column(String, nullable=True)
    accessibility_needs = Column(JSON, default=list)
    preferred_session_minutes = Column(Integer, nullable=True)
    onboarding_completed_at = Column(DateTime, nullable=True)
    profile_version = Column(Integer, nullable=False, default=1)
    
    # Relationships
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    learner_skills = relationship("LearnerSkill", back_populates="user", cascade="all, delete-orphan")
    learning_history = relationship("LearningHistory", back_populates="user", cascade="all, delete-orphan")
    skill_evidence = relationship("SkillEvidence", back_populates="user", cascade="all, delete-orphan")


class OnboardingSession(Base):
    """Server-side resumable onboarding draft."""
    __tablename__ = "onboarding_sessions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("app_users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    current_step = Column(String, nullable=False, default="goal")
    completed_steps = Column(JSON, nullable=False, default=list)
    draft = Column(JSON, nullable=False, default=dict)
    status = Column(String, nullable=False, default="in_progress")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("AppUser", back_populates="onboarding_session")


class Skill(Base):
    """Canonical skill taxonomy entry."""
    __tablename__ = "skills"

    id = Column(String, primary_key=True)
    canonical_name = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")


class SkillAlias(Base):
    """Normalized alias resolving learner input to a canonical skill."""
    __tablename__ = "skill_aliases"

    id = Column(String, primary_key=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String, nullable=False, unique=True)

    skill = relationship("Skill", back_populates="aliases")


class LearnerSkill(Base):
    """A learner's current proficiency estimate for a canonical skill."""
    __tablename__ = "learner_skills"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_learner_skill_user_skill"),
        Index("ix_learner_skills_user_id", "user_id"),
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False)
    display_name = Column(String, nullable=False)
    proficiency = Column(String, nullable=False)
    confidence = Column(Float, nullable=False, default=0.5)
    source = Column(String, nullable=False, default="self_reported")
    evidence_url = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="learner_skills")
    skill = relationship("Skill")


class LearningHistory(Base):
    """A completed course or learning experience supplied by the learner."""
    __tablename__ = "learning_history"
    __table_args__ = (Index("ix_learning_history_user_id", "user_id"),)

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    provider = Column(String, nullable=True)
    external_id = Column(String, nullable=True)
    resource_url = Column(String, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    topics = Column(JSON, nullable=False, default=list)
    rating = Column(Integer, nullable=True)
    evidence_url = Column(String, nullable=True)
    source = Column(String, nullable=False, default="manual")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="learning_history")


class SkillEvidence(Base):
    """Weighted observation used to estimate learner proficiency."""
    __tablename__ = "skill_evidence"
    __table_args__ = (
        Index("ix_skill_evidence_user_skill", "user_id", "skill_id"),
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False)
    evidence_type = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=False, default=0.5)
    weight = Column(Float, nullable=False, default=1.0)
    rationale = Column(Text, nullable=True)
    evidence_metadata = Column("metadata", JSON, nullable=False, default=dict)
    observed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("UserProfile", back_populates="skill_evidence")
    skill = relationship("Skill")


class LearningResource(Base):
    """Verified or provider-sourced learning material eligible for recommendations."""
    __tablename__ = "learning_resources"
    __table_args__ = (
        UniqueConstraint("provider", "external_id", name="uq_learning_resource_provider_external"),
        Index("ix_learning_resources_catalog", "verification_status", "archived_at", "resource_type"),
    )

    id = Column(String, primary_key=True)
    provider = Column(String, nullable=False)
    external_id = Column(String, nullable=True)
    resource_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    topics = Column(JSON, nullable=False, default=list)
    prerequisites = Column(JSON, nullable=False, default=list)
    cost_type = Column(String, nullable=False, default="free")
    price = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    language = Column(String, nullable=False, default="English")
    url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    verification_status = Column(String, nullable=False, default="pending")
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    link_status = Column(String, nullable=False, default="unchecked")
    resource_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


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
