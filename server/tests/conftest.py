import os


os.environ.setdefault("GOOGLE_API_KEY", "test-google-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_trellis.db")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("APPWRITE_ENDPOINT", "https://appwrite.test/v1")
os.environ.setdefault("APPWRITE_PROJECT_ID", "test-project")
os.environ.setdefault("ADMIN_USER_IDS", "admin-user")
