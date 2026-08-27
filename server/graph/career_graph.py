"""Main LangGraph career mentor agent."""
from typing import Dict, Any, Optional
from datetime import datetime

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session

from graph.state import AgentState
from graph.nodes import create_nodes
from config import settings


class CareerMentorGraph:
    """The main career mentor agent graph."""
    
    def __init__(self, db: Session):
        self.db = db
        self.nodes = create_nodes(db)
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        
        # Create graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("load_context", self.nodes.load_context)
        workflow.add_node("understand_intent", self.nodes.understand_intent)
        workflow.add_node("execute_action", self.nodes.execute_action)
        workflow.add_node("generate_response", self.nodes.generate_response)
        workflow.add_node("save_memory", self.nodes.save_memory)
        
        # Define edges
        workflow.set_entry_point("load_context")
        
        workflow.add_edge("load_context", "understand_intent")
        
        # Conditional: if action required, execute it
        workflow.add_conditional_edges(
            "understand_intent",
            self._should_execute_action,
            {
                "execute": "execute_action",
                "skip": "generate_response"
            }
        )
        
        workflow.add_edge("execute_action", "generate_response")
        workflow.add_edge("generate_response", "save_memory")
        workflow.add_edge("save_memory", END)
        
        # Compile with checkpointing
        if settings.CHECKPOINT_ENABLED:
            checkpointer = MemorySaver()
            return workflow.compile(checkpointer=checkpointer)
        
        return workflow.compile()
    
    def _should_execute_action(self, state: AgentState) -> str:
        """Decide if action execution is needed."""
        if state.get("requires_action") and state.get("action_type"):
            return "execute"
        return "skip"
    
    async def run(
        self,
        user_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run the agent for a user message.
        
        Args:
            user_id: User identifier
            message: User's message
            context: Optional additional context
        
        Returns:
            Agent response with suggestions and action items
        """
        # Initialize state
        initial_state: AgentState = {
            "messages": [HumanMessage(content=message)],
            "user_id": user_id,
            "current_skills": [],
            "target_role": None,
            "career_goals": [],
            "experience_years": 0.0,
            "active_roadmap": None,
            "pending_milestones": [],
            "recent_memories": [],
            "recent_applications": [],
            "intent": None,
            "requires_action": False,
            "action_type": None,
            "action_params": {},
            "response": None,
            "suggestions": [],
            "action_items": [],
            "iteration": 0,
            "timestamp": datetime.utcnow()
        }
        
        # Run graph
        config = {"configurable": {"thread_id": user_id}} if settings.CHECKPOINT_ENABLED else {}
        
        final_state = await self.graph.ainvoke(initial_state, config)
        
        # Extract response
        return {
            "response": final_state.get("response", "I'm here to help with your career!"),
            "suggestions": final_state.get("suggestions", []),
            "action_items": final_state.get("action_items", []),
            "metadata": {
                "intent": final_state.get("intent"),
                "action_taken": final_state.get("requires_action"),
                "iteration": final_state.get("iteration")
            }
        }


def create_career_graph(db: Session) -> CareerMentorGraph:
    """Factory function to create career mentor graph."""
    return CareerMentorGraph(db)
