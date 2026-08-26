"""Agent node implementations for the career mentor graph."""
from typing import Dict, Any
from datetime import datetime
import json

from langchain_groq import ChatGroq
from sqlalchemy.orm import Session

from graph.state import AgentState
from graph.tools import CareerMentorTools
from memory import memory_manager
from config import settings


class AgentNodes:
    """Node functions for the LangGraph workflow."""
    
    def __init__(self, db: Session):
        self.db = db
        self.tools = CareerMentorTools(db)
        self.llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7
        )
    
    async def load_context(self, state: AgentState) -> AgentState:
        """
        Load user context: profile, memories, roadmap.
        This node runs at the start of every conversation.
        """
        user_id = state["user_id"]
        
        # Load profile
        profile = await self.tools.read_user_profile(user_id)
        
        # Get last user message
        if state["messages"]:
            last_msg = state["messages"][-1]
            if isinstance(last_msg, dict):
                last_message = last_msg.get('content', str(last_msg))
            elif hasattr(last_msg, 'content'):
                last_message = last_msg.content
            else:
                last_message = str(last_msg)
        else:
            last_message = ""
        
        # Retrieve relevant memories
        relevant_memories = await memory_manager.retrieve_relevant_memories(
            self.db,
            user_id,
            last_message,
            top_k=5
        )
        
        # Get recent applications
        recent_apps = await self.tools.get_recent_applications(user_id, limit=3)
        
        # Update state
        state["current_skills"] = profile["skills"]
        state["target_role"] = profile["target_role"]
        state["career_goals"] = profile["career_goals"]
        state["recent_memories"] = [
            {"content": m.content, "type": m.memory_type, "created": m.created_at.isoformat()}
            for m in relevant_memories
        ]
        state["recent_applications"] = recent_apps
        state["iteration"] = state.get("iteration", 0) + 1
        
        return state
    
    async def understand_intent(self, state: AgentState) -> AgentState:
        """
        Analyze user message to determine intent and required actions.
        """
        last_msg = state["messages"][-1]
        if isinstance(last_msg, dict):
            last_message = last_msg.get('content', str(last_msg))
        elif hasattr(last_msg, 'content'):
            last_message = last_msg.content
        else:
            last_message = str(last_msg)
        
        # Context for intent detection
        context = {
            "user_message": last_message,
            "target_role": state.get("target_role"),
            "has_roadmap": state.get("active_roadmap") is not None
        }
        
        intent_prompt = f"""Analyze this user message and determine their intent:

Message: "{last_message}"

Context:
- Target role: {context['target_role']}
- Has active roadmap: {context['has_roadmap']}

Classify intent as ONE of:
- skill_assessment: User wants to discuss/update their skills
- roadmap_request: User wants a learning roadmap
- job_search: User wants job recommendations
- application_help: User needs help with applications/interviews
- milestone_update: User completed something or wants to log progress
- general_advice: General career discussion
- other: None of the above

Also determine if this requires a specific action (true/false).

Respond in JSON:
{{"intent": "...", "requires_action": true/false, "action_type": "...", "reasoning": "..."}}
"""
        
        response = await self.llm.ainvoke(intent_prompt)
        
        try:
            intent_data = json.loads(response.content)
            state["intent"] = intent_data["intent"]
            state["requires_action"] = intent_data["requires_action"]
            state["action_type"] = intent_data.get("action_type")
        except:
            # Fallback
            state["intent"] = "general_advice"
            state["requires_action"] = False
        
        return state
    
    async def execute_action(self, state: AgentState) -> AgentState:
        """
        Execute specific actions based on intent.
        """
        action_type = state.get("action_type")
        user_id = state["user_id"]
        
        if action_type == "skill_assessment":
            # Analyze current skills vs target role
            target_role = state.get("target_role", "Software Engineer")
            gaps = await self.tools.get_skill_gaps(user_id, target_role)
            
            state["action_params"] = {
                "skill_gaps": gaps,
                "analysis_completed": True
            }
        
        elif action_type == "roadmap_generation":
            # Generate learning roadmap
            target_role = state.get("target_role", "Software Engineer")
            gaps = await self.tools.get_skill_gaps(user_id, target_role)
            
            # Generate projects for each gap
            projects = []
            for skill in gaps[:3]:  # Top 3 gaps
                ideas = await self.tools.generate_project_ideas([skill])
                projects.extend(ideas)
            
            state["action_params"] = {
                "roadmap_generated": True,
                "skill_gaps": gaps,
                "project_ideas": projects
            }
        
        elif action_type == "job_search":
            # Market analysis
            target_role = state.get("target_role", "Software Engineer")
            market_data = await self.tools.analyze_market_trends(target_role)
            
            state["action_params"] = {
                "market_analysis": market_data,
                "job_search_completed": True
            }
        
        else:
            state["action_params"] = {}
        
        return state
    
    async def generate_response(self, state: AgentState) -> AgentState:
        """
        Generate final response to user using all available context.
        """
        last_msg = state["messages"][-1]
        if isinstance(last_msg, dict):
            user_message = last_msg.get('content', str(last_msg))
        elif hasattr(last_msg, 'content'):
            user_message = last_msg.content
        else:
            user_message = str(last_msg)
        
        # Build rich context
        context_parts = [
            f"User message: {user_message}",
            f"Detected intent: {state.get('intent')}",
            f"Target role: {state.get('target_role', 'Not set')}",
            f"Current skills: {', '.join([s['name'] for s in state.get('current_skills', [])])}"
        ]
        
        if state.get("recent_memories"):
            context_parts.append(f"Recent relevant context: {len(state['recent_memories'])} memories")
        
        if state.get("action_params"):
            context_parts.append(f"Action results: {json.dumps(state['action_params'], indent=2)}")
        
        response_prompt = f"""You are an expert AI career mentor. Generate a helpful, personalized response.

Context:
{chr(10).join(context_parts)}

Instructions:
- Be encouraging and actionable
- Reference specific skills and gaps when relevant
- Suggest concrete next steps
- Keep your response very short.
- Use a warm, professional tone

Generate your response:"""
        
        response = await self.llm.ainvoke(response_prompt)
        
        # Ensure response content is a string
        content = response.content
        if isinstance(content, list):
            # Handle list of content blocks
            text_parts = []
            for block in content:
                if isinstance(block, str):
                    text_parts.append(block)
                elif isinstance(block, dict) and 'text' in block:
                    text_parts.append(block['text'])
                else:
                    text_parts.append(str(block))
            state["response"] = " ".join(text_parts)
        else:
            state["response"] = str(content)
        
        # Generate suggestions
        state["suggestions"] = self._extract_suggestions(state)
        state["action_items"] = self._extract_action_items(state)
        
        return state
    
    async def save_memory(self, state: AgentState) -> AgentState:
        """
        Save this interaction to long-term memory.
        """
        user_id = state["user_id"]
        last_msg = state["messages"][-1]
        
        if isinstance(last_msg, dict):
            user_message = last_msg.get('content', str(last_msg))
        elif hasattr(last_msg, 'content'):
            user_message = last_msg.content
        else:
            user_message = str(last_msg)
            
        agent_response = state.get("response", "")
        
        # Save user message as episodic memory
        await memory_manager.add_memory(
            self.db,
            user_id=user_id,
            content=f"User: {user_message}",
            memory_type="episodic",
            importance=0.5,
            metadata={"intent": state.get("intent")}
        )
        
        # Save agent response
        await memory_manager.add_memory(
            self.db,
            user_id=user_id,
            content=f"Agent: {agent_response}",
            memory_type="episodic",
            importance=0.3
        )
        
        # If action was taken, save as higher-importance memory
        if state.get("requires_action") and state.get("action_params"):
            await memory_manager.add_memory(
                self.db,
                user_id=user_id,
                content=f"Action taken: {state['action_type']} - {json.dumps(state['action_params'])}",
                memory_type="semantic",
                importance=0.8,
                tags=[state['action_type']]
            )
        
        return state
    
    def _extract_suggestions(self, state: AgentState) -> list:
        """Extract actionable suggestions from state."""
        suggestions = []
        
        if state.get("action_type") == "roadmap_generation":
            suggestions.append("Review your personalized learning roadmap")
            suggestions.append("Start with the first milestone project")
        
        if state.get("skill_gaps"):
            suggestions.append(f"Focus on learning: {', '.join(state['skill_gaps'][:3])}")
        
        return suggestions[:3]
    
    def _extract_action_items(self, state: AgentState) -> list:
        """Extract specific action items."""
        items = []
        
        if state.get("action_type") == "job_search":
            items.append("Review recommended job postings")
            items.append("Update resume with recent projects")
        
        return items[:3]


def create_nodes(db: Session) -> AgentNodes:
    """Factory function to create nodes."""
    return AgentNodes(db)
