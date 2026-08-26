"""Resume parsing and skills extraction module."""
from typing import Dict, Any, List, Optional
import io
import re
from datetime import datetime

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    from docx import Document
except ImportError:
    Document = None

from langchain_groq import ChatGroq
from config import settings


class ResumeParser:
    """Extract structured information from resumes."""
    
    def __init__(self):
        self.llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0
        )
    
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file."""
        if not PyPDF2:
            raise ImportError("PyPDF2 not installed. Run: pip install PyPDF2")
        
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file."""
        if not Document:
            raise ImportError("python-docx not installed. Run: pip install python-docx")
        
        try:
            docx_file = io.BytesIO(file_content)
            doc = Document(docx_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
    
    def extract_text(self, file_content: bytes, file_type: str) -> str:
        """Extract text based on file type."""
        file_type = file_type.lower()
        
        if file_type in ['pdf', 'application/pdf']:
            return self.extract_text_from_pdf(file_content)
        elif file_type in ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return self.extract_text_from_docx(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    async def parse_resume(self, file_content: bytes, file_type: str) -> Dict[str, Any]:
        """
        Parse resume and extract structured information.
        
        Args:
            file_content: Raw file bytes
            file_type: File MIME type or extension
        
        Returns:
            Structured resume data
        """
        # Extract text
        text = self.extract_text(file_content, file_type)
        
        # Use LLM to extract structured data
        prompt = f"""Extract structured information from this resume. Return ONLY valid JSON with this exact structure:

{{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number or null",
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "University Name",
            "year": "Graduation Year",
            "field": "Field of Study"
        }}
    ],
    "experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Start - End",
            "description": "Brief description"
        }}
    ],
    "skills": ["skill1", "skill2", "skill3"],
    "certifications": ["cert1", "cert2"],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Brief description",
            "technologies": ["tech1", "tech2"]
        }}
    ]
}}

Resume text:
{text}

Return ONLY the JSON object, no additional text."""

        response = await self.llm.ainvoke(prompt)
        
        # Parse LLM response
        import json
        try:
            # Extract JSON from response
            if hasattr(response, 'content'):
                response_text = response.content if isinstance(response.content, str) else str(response.content)
            else:
                response_text = str(response)
            
            # Find JSON object in response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group())
            else:
                parsed_data = json.loads(response_text)
            
            # Add metadata
            parsed_data['parsed_at'] = datetime.utcnow().isoformat()
            parsed_data['raw_text'] = text[:1000]  # Store first 1000 chars
            
            return parsed_data
        
        except json.JSONDecodeError as e:
            # Fallback: extract basic info using regex
            return self._fallback_parse(text)
    
    def _fallback_parse(self, text: str) -> Dict[str, Any]:
        """Fallback parsing using regex patterns."""
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        
        # Extract phone
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        phones = re.findall(phone_pattern, text)
        
        # Extract skills (common programming languages and tools)
        skill_keywords = [
            'python', 'java', 'javascript', 'typescript', 'react', 'node',
            'sql', 'mongodb', 'postgresql', 'docker', 'kubernetes', 'aws',
            'git', 'html', 'css', 'angular', 'vue', 'django', 'flask',
            'fastapi', 'spring', 'tensorflow', 'pytorch', 'pandas', 'numpy'
        ]
        
        found_skills = []
        text_lower = text.lower()
        for skill in skill_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        return {
            "name": None,
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
            "education": [],
            "experience": [],
            "skills": found_skills,
            "certifications": [],
            "projects": [],
            "parsed_at": datetime.utcnow().isoformat(),
            "raw_text": text[:1000],
            "parsing_method": "fallback"
        }


# Global instance
resume_parser = ResumeParser()
