"""State definition for the career mentor agent."""
from typing import Annotated, TypedDict, List, Dict, Any, Optional
from langgraph.graph import add_messages
from datetime import datetime


class AgentState(TypedDict):
    """
    State object for the career mentor agent.
    
    This maintains conversation context, user profile data,
    and intermediate results throughout the agent's execution.
    """
    
    # Conversation
    messages: Annotated[List[Dict[str, str]], add_messages]
    user_id: str
    
    # User Profile Context
    current_skills: List[Dict[str, Any]]
    target_role: Optional[str]
    career_goals: List[Dict[str, Any]]
    experience_years: float
    
    # Active Roadmap
    active_roadmap: Optional[Dict[str, Any]]
    pending_milestones: List[Dict[str, Any]]
    
    # Recent Context
    recent_memories: List[Dict[str, Any]]
    recent_applications: List[Dict[str, Any]]
    
    # Agent Processing
    intent: Optional[str]  # Detected user intent
    requires_action: bool
    action_type: Optional[str]  # roadmap_generation, job_search, skill_analysis, etc.
    action_params: Dict[str, Any]
    
    # Response Generation
    response: Optional[str]
    suggestions: List[str]
    action_items: List[str]
    
    # Metadata
    iteration: int
    timestamp: datetime
