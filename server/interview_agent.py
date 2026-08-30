import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config import settings
from schemas import (
    InterviewSessionRequest, 
    InterviewInteractionResponse,
    InterviewFinalReport
)
from memory import memory_manager

class InterviewAgent:
    """Agent for conducting mock AI interviews."""
    
    def __init__(self, db):
        self.db = db
        self.llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.6 # Slightly lower temp for structured evaluation
        )
        # Simple in-memory session store (replace with Redis/DB in prod)
        # Format: {session_id: {history: [], config: {...}, question_count: 0}}
        self.sessions = {}

    async def start_session(self, request: InterviewSessionRequest) -> InterviewInteractionResponse:
        """Start a new interview session."""
        session_id = str(uuid.uuid4())
        
        # Initialize session
        self.sessions[session_id] = {
            "user_id": request.user_id,
            "role": request.target_role,
            "focus": request.focus_area,
            "difficulty": request.difficulty,
            "history": [], # List of conversation turns
            "question_count": 0,
            "max_questions": 5, # Short 5-question interview
            "scores": []
        }
        
        # Generate first question
        question = await self._generate_question(session_id)
        self.sessions[session_id]["last_question"] = question  # IMPORTANT: Save for context
        
        return InterviewInteractionResponse(
            session_id=session_id,
            question=question,
            question_type="initial",
            state="in_progress"
        )

    async def _generate_question(self, session_id: str) -> str:
        """Generate the next interview question based on context."""
        session = self.sessions[session_id]
        role = session["role"]
        focus = session["focus"]
        difficulty = session["difficulty"]
        history = session["history"]
        
        # Construct prompt
        system_prompt = f"""You are an expert technical interviewer at a top tech company (like Google/Figma).
        You are interviewing a candidate for a {role} position.
        Focus Area: {focus}
        Difficulty: {difficulty}
        
        Your goal is to assess their depth of knowledge.
        Ask ONE clear, concise question. Do not provide the answer.
        If this is the start, ask a foundational question.
        If following up, dig deeper into their previous response.
        """
        
        messages = [SystemMessage(content=system_prompt)]
        
        # Add history context
        for turn in history:
            messages.append(AIMessage(content=turn["question"]))
            messages.append(HumanMessage(content=turn["answer"]))
            
        # Add instruction
        messages.append(HumanMessage(content="Ask the next interview question."))
        
        response = await self.llm.ainvoke(messages)
        return response.content

    async def submit_answer(self, session_id: str, answer: str) -> InterviewInteractionResponse:
        """Evaluate answer and generate next step."""
        if session_id not in self.sessions:
            raise ValueError("Session not found")
            
        session = self.sessions[session_id]
        
        # 1. Evaluate answer
        feedback, score = await self._evaluate_answer(session_id, answer)
        
        # Update session
        session["history"].append({
            "question": session.get("last_question", "Initial Question"), # Needs handling
            "answer": answer,
            "feedback": feedback,
            "score": score
        })
        session["scores"].append(score)
        session["question_count"] += 1
        
        # Check if finished
        if session["question_count"] >= session["max_questions"]:
            return await self._finish_session(session_id)
        
        # 2. Generate NEXT question
        next_question = await self._generate_question(session_id)
        session["last_question"] = next_question # Store for next turn
        
        return InterviewInteractionResponse(
            session_id=session_id,
            question=next_question,
            question_type="follow_up",
            previous_feedback=feedback,
            previous_score=score,
            state="in_progress"
        )

    async def _evaluate_answer(self, session_id: str, answer: str): 
        """Evaluate the user's answer significantly."""
        session = self.sessions[session_id]
        # We need to know what the question was. 
        # Ideally state tracking should be robust.
        # For prototype, we re-infer or assume last question is context.
        # But wait, _generate_question returns content, we didn't save it in 'last_question' in start_session.
        # Fixed logic: start_session should save 'last_question'.
        
        last_q = session.get("last_question", "Introductory context")
        
        min_prompt = f"""Evaluate this interview answer.
        Question: {last_q}
        Candidate Answer: {answer}
        
        Provide:
        1. A score (0-100).
        2. Brief feedback (2 sentences: what was good, what was missing).
        
        Format: JSON {{ "score": 85, "feedback": "..." }}
        """
        
        try:
            response = await self.llm.ainvoke(min_prompt)
            import json, re
            # Extract JSON
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return data["feedback"], data["score"]
            else:
                return response.content[:100], 70 # Fallback
        except:
             return "Good effort.", 75

    async def _finish_session(self, session_id: str) -> InterviewInteractionResponse:
        """End the interview."""
        return InterviewInteractionResponse(
            session_id=session_id,
            question="Interview Completed.",
            question_type="end",
            state="completed"
        )

    async def generate_final_report(self, session_id: str) -> InterviewFinalReport:
        session = self.sessions[session_id]
        
        # Calculate summary stats
        avg_score = sum(session["scores"]) // len(session["scores"]) if session["scores"] else 0
        
        # Save to detailed memory
        await memory_manager.add_memory(
            self.db,
            user_id=session["user_id"],
            content=f"Completed {session['focus']} Mock Interview for {session['role']}. Score: {avg_score}/100.",
            memory_type="semantic",
            importance=0.9,
            tags=["interview", "practice", session["focus"]]
        )
        
        prompt = f"""Generate a final interview feedback report.
        Role: {session['role']}
        History: {session['history']}
        
        Output JSON: {{
            "summary": "...",
            "strengths": ["...", "..."],
            "improvements": ["...", "..."]
        }}
        """
        
        try:
            response = await self.llm.ainvoke(prompt)
            import json, re
            match = re.search(r'\{.*\}', response.content, re.DOTALL)
            data = json.loads(match.group())
        except:
            data = {"summary": "Completed", "strengths": [], "improvements": []}
            
        return InterviewFinalReport(
            session_id=session_id,
            user_id=session["user_id"],
            role=session["role"],
            overall_score=avg_score,
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", []),
            summary=data.get("summary", ""),
            transcript=[{"role": "system", "content": "Transcript available"}]
        )

# Global Instance
interview_agent = None # Will instantiate with DB in main.py

def get_interview_agent(db):
    """Factory to get agent instance."""
    global interview_agent
    if interview_agent is None:
        interview_agent = InterviewAgent(db)
    return interview_agent
