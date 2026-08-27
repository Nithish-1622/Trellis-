"""Learning resource recommendations."""
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq
from config import settings


class LearningResourceFetcher:
    """Fetch and recommend learning resources."""
    
    def __init__(self):
        self.llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7
        )
    
    async def get_resources_for_skill(
        self,
        skill: str,
        level: str = "beginner",
        resource_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get learning resources for a specific skill.
        
        Args:
            skill: Skill name (e.g., "Python", "Docker", "React")
            level: Skill level (beginner, intermediate, advanced)
            resource_types: List of types (course, tutorial, book, project, video)
        
        Returns:
            List of learning resources
        """
        if resource_types is None:
            resource_types = ["course", "tutorial", "video", "project"]
        
        prompt = f"""Recommend the best learning resources for learning {skill} at {level} level.

Include these types of resources: {', '.join(resource_types)}

For each resource, provide:
- Title
- Type (course, tutorial, video, book, project)
- Platform (YouTube, Coursera, Udemy, freeCodeCamp, etc.)
- URL (real URLs when possible, or indicate if mock)
- Duration estimate
- Key topics covered
- Prerequisites (if any)

Format as JSON array:
[
    {{
        "title": "Resource Title",
        "type": "course",
        "platform": "Coursera",
        "url": "https://...",
        "duration": "4 weeks",
        "topics": ["topic1", "topic2"],
        "prerequisites": ["prereq1"],
        "difficulty": "beginner"
    }}
]

Recommend 5-7 high-quality resources. Return ONLY the JSON array."""

        response = await self.llm.ainvoke(prompt)
        
        # Parse response
        import json
        import re
        
        try:
            if hasattr(response, 'content'):
                response_text = response.content if isinstance(response.content, str) else str(response.content)
            else:
                response_text = str(response)
            
            # Extract JSON array
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                resources = json.loads(json_match.group())
            else:
                resources = json.loads(response_text)
            
            return resources
        
        except Exception as e:
            # Return fallback resources
            return self._get_fallback_resources(skill, level)
    
    def _get_fallback_resources(self, skill: str, level: str) -> List[Dict[str, Any]]:
        """Fallback resources when LLM fails."""
        skill_lower = skill.lower()
        
        # Common resource templates
        resources = []
        
        # YouTube
        resources.append({
            "title": f"{skill} Tutorial for {level.title()}s",
            "type": "video",
            "platform": "YouTube",
            "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial+{level}",
            "duration": "Varies",
            "topics": [skill, "hands-on practice"],
            "prerequisites": [],
            "difficulty": level
        })
        
        # freeCodeCamp
        if skill_lower in ['javascript', 'python', 'html', 'css', 'react', 'node']:
            resources.append({
                "title": f"{skill} on freeCodeCamp",
                "type": "course",
                "platform": "freeCodeCamp",
                "url": "https://www.freecodecamp.org/",
                "duration": "Self-paced",
                "topics": [skill, "projects", "certification"],
                "prerequisites": [],
                "difficulty": level
            })
        
        # Coursera
        resources.append({
            "title": f"{skill} Specialization",
            "type": "course",
            "platform": "Coursera",
            "url": f"https://www.coursera.org/search?query={skill.replace(' ', '%20')}",
            "duration": "4-8 weeks",
            "topics": [skill, "hands-on projects"],
            "prerequisites": ["Basic programming" if level != "beginner" else "None"],
            "difficulty": level
        })
        
        # Documentation
        resources.append({
            "title": f"Official {skill} Documentation",
            "type": "tutorial",
            "platform": "Official Docs",
            "url": f"https://www.google.com/search?q={skill.replace(' ', '+')}+official+documentation",
            "duration": "Reference",
            "topics": [skill, "API reference", "examples"],
            "prerequisites": [],
            "difficulty": "all levels"
        })
        
        # Project ideas
        resources.append({
            "title": f"{skill} Project Ideas",
            "type": "project",
            "platform": "GitHub",
            "url": f"https://github.com/search?q={skill.replace(' ', '+')}+projects",
            "duration": "Varies",
            "topics": [skill, "real-world applications"],
            "prerequisites": [f"Basic {skill}"],
            "difficulty": level
        })
        
        return resources
    
    async def get_roadmap_resources(
        self,
        skills: List[str],
        level: str = "intermediate"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get resources for multiple skills (roadmap).
        
        Args:
            skills: List of skills to learn
            level: Overall skill level
        
        Returns:
            Dictionary mapping skills to resources
        """
        roadmap = {}
        
        for skill in skills:
            resources = await self.get_resources_for_skill(skill, level)
            roadmap[skill] = resources
        
        return roadmap


# Global instance
learning_resources = LearningResourceFetcher()
