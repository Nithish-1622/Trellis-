import os


os.environ["GOOGLE_API_KEY"] = "test-google-key"
os.environ["GROQ_API_KEY"] = "test-groq-key"
os.environ["DATABASE_URL"] = "sqlite:///./test_trellis.db"
os.environ["DEBUG"] = "false"
os.environ["APPWRITE_ENDPOINT"] = "https://appwrite.test/v1"
os.environ["APPWRITE_PROJECT_ID"] = "test-project"
os.environ["ADMIN_USER_IDS"] = "admin-user"
