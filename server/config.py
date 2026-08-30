"""Configuration management for the Career Mentor API."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "Trellis Personalized Learning API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PILOT_FEATURE_ENABLED: bool = True
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Identity
    APPWRITE_ENDPOINT: str = ""
    APPWRITE_PROJECT_ID: str = ""
    APPWRITE_AUTH_TIMEOUT_SECONDS: float = 5.0
    ADMIN_USER_IDS: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./career_mentor.db"
    
    # Google Gemini (Legacy / Embeddings)
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-pro"
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"
    
    # Groq (Main LLM)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    ENABLE_AI_PROJECT_GRADING: bool = False
    ENABLE_AI_CHAT: bool = False
    
    # JSearch API (RapidAPI)
    JSEARCH_API_KEY: str = ""
    JSEARCH_API_HOST: str = "jsearch.p.rapidapi.com"

    # Supplemental learning resource providers
    YOUTUBE_API_KEY: str = ""
    GITHUB_TOKEN: str = ""
    PROVIDER_TIMEOUT_SECONDS: float = 8.0
    RESOURCE_DISCOVERY_PROVIDER_LIMIT: int = 10
    YOUTUBE_MIN_DURATION_SECONDS: int = 120
    YOUTUBE_MAX_DURATION_SECONDS: int = 14400
    
    # LangSmith (Optional)
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "career-mentor"
    
    # Memory & Vector Store
    VECTOR_DIMENSION: int = 768  # Gemini text-embedding-004 is 768
    MEMORY_SIMILARITY_THRESHOLD: float = 0.7
    
    # Agent
    MAX_ITERATIONS: int = 15
    CHECKPOINT_ENABLED: bool = True
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def admin_user_ids(self) -> set[str]:
        """Parse the configured bootstrap administrator identifiers."""
        return {user_id.strip() for user_id in self.ADMIN_USER_IDS.split(",") if user_id.strip()}

settings = Settings()
