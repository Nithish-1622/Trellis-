"""Long-term memory system for the career mentor agent."""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import numpy as np
from sqlalchemy.orm import Session
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from database import Memory, UserProfile
from config import settings


class MemoryManager:
    """Manages semantic and episodic memory for users."""
    
    def __init__(self):
        """Initialize memory manager with embeddings."""
        self.embedding_client = GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY
        )
    
    async def add_memory(
        self,
        db: Session,
        user_id: str,
        content: str,
        memory_type: str = "episodic",
        importance: float = 0.5,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Memory:
        """
        Add a new memory entry.
        
        Args:
            db: Database session
            user_id: User identifier
            content: Memory content text
            memory_type: Type (episodic, semantic, feedback)
            importance: Importance score 0-1
            tags: Optional tags
            metadata: Additional metadata
        
        Returns:
            Created Memory object
        """
        # Generate embedding for semantic search (with fallback)
        try:
            # LangChain's Google embeddings return a list of floats
            embedding = self.embedding_client.embed_query(content)
        except Exception as e:
            # If embedding fails (e.g., quota), use empty embedding
            print(f"Warning: Failed to generate embedding: {str(e)[:100]}")
            embedding = []
        
        memory = Memory(
            id=f"{user_id}_{datetime.utcnow().timestamp()}",
            user_id=user_id,
            content=content,
            memory_type=memory_type,
            embedding=embedding,
            importance=importance,
            tags=tags or [],
            meta_data=metadata or {}  # Changed from metadata to meta_data
        )
        
        db.add(memory)
        db.commit()
        db.refresh(memory)
        
        return memory
    
    async def retrieve_relevant_memories(
        self,
        db: Session,
        user_id: str,
        query: str,
        top_k: int = 5,
        memory_type: Optional[str] = None,
        min_importance: float = 0.0
    ) -> List[Memory]:
        """
        Retrieve memories relevant to a query using semantic search.
        
        Args:
            db: Database session
            user_id: User identifier
            query: Search query
            top_k: Number of results
            memory_type: Filter by memory type
            min_importance: Minimum importance threshold
        
        Returns:
            List of relevant Memory objects
        """
        # Generate query embedding (with fallback)
        try:
            query_embedding = self.embedding_client.embed_query(query)
        except Exception as e:
            # If embedding fails, return recent memories instead
            print(f"Warning: Failed to generate query embedding, using recency: {str(e)[:100]}")
            query_obj = db.query(Memory).filter(Memory.user_id == user_id)
            if memory_type:
                query_obj = query_obj.filter(Memory.memory_type == memory_type)
            if min_importance > 0:
                query_obj = query_obj.filter(Memory.importance >= min_importance)
            return query_obj.order_by(Memory.created_at.desc()).limit(top_k).all()
        
        # Get all user memories
        query_obj = db.query(Memory).filter(Memory.user_id == user_id)
        
        if memory_type:
            query_obj = query_obj.filter(Memory.memory_type == memory_type)
        
        if min_importance > 0:
            query_obj = query_obj.filter(Memory.importance >= min_importance)
        
        memories = query_obj.all()
        
        if not memories:
            return []
        
        # Calculate similarity scores
        scored_memories = []
        for memory in memories:
            if memory.embedding:
                similarity = self._cosine_similarity(query_embedding, memory.embedding)
                if similarity >= settings.MEMORY_SIMILARITY_THRESHOLD:
                    scored_memories.append((similarity, memory))
        
        # Sort by similarity and return top_k
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [mem for _, mem in scored_memories[:top_k]]
    
    def get_recent_memories(
        self,
        db: Session,
        user_id: str,
        days: int = 7,
        limit: int = 10
    ) -> List[Memory]:
        """Get recent memories from the last N days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.created_at >= cutoff_date
        ).order_by(Memory.created_at.desc()).limit(limit).all()
    
    def get_important_memories(
        self,
        db: Session,
        user_id: str,
        min_importance: float = 0.7,
        limit: int = 10
    ) -> List[Memory]:
        """Get high-importance memories."""
        return db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.importance >= min_importance
        ).order_by(Memory.importance.desc()).limit(limit).all()
    
    async def consolidate_memories(
        self,
        db: Session,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Consolidate and summarize user memories.
        
        This creates a compressed representation of key patterns,
        skills, preferences, and feedback over time.
        
        Returns:
            Dictionary with consolidated insights
        """
        # Get all memories
        all_memories = db.query(Memory).filter(Memory.user_id == user_id).all()
        
        if not all_memories:
            return {"summary": "No memories yet", "insights": []}
        
        # Group by type
        by_type = {}
        for mem in all_memories:
            if mem.memory_type not in by_type:
                by_type[mem.memory_type] = []
            by_type[mem.memory_type].append(mem.content)
        
        # Extract patterns
        feedback_items = by_type.get("feedback", [])
        episodic_items = by_type.get("episodic", [])
        
        return {
            "total_memories": len(all_memories),
            "by_type": {k: len(v) for k, v in by_type.items()},
            "recent_feedback_count": len([m for m in all_memories 
                                         if m.memory_type == "feedback" 
                                         and m.created_at > datetime.utcnow() - timedelta(days=30)]),
            "high_importance_count": len([m for m in all_memories if m.importance >= 0.7]),
            "oldest_memory": min(m.created_at for m in all_memories),
            "newest_memory": max(m.created_at for m in all_memories)
        }
    
    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))


# Singleton instance
memory_manager = MemoryManager()
