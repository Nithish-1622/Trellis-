"""Trellis FastAPI application composition."""

from contextlib import asynccontextmanager
from datetime import datetime
import logging
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from adaptation_api import adaptation_router, roadmap_router as adaptation_roadmap_router
from assessment_api import router as assessment_router
from auth import AuthenticatedUser, get_current_user
from career_api import router as career_router
from catalog_api import admin_router as catalog_admin_router, learner_router as catalog_learner_router
from chat_api import router as chat_router
from config import settings
from dashboard_api import router as dashboard_router
from database import get_db
from errors import register_error_handlers
from learning_history_api import router as learning_history_router
from migration_runner import run_migrations
from profile_api import router as profile_router
from roadmap_api import router as roadmap_router


logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Apply forward-only schema migrations before accepting traffic."""
    logger.info("Starting Trellis API")
    run_migrations()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Personalized learning paths backed by learner-controlled evidence.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
register_error_handlers(app)

for router in (
    profile_router,
    learning_history_router,
    catalog_learner_router,
    catalog_admin_router,
    roadmap_router,
    assessment_router,
    adaptation_roadmap_router,
    adaptation_router,
    dashboard_router,
    chat_router,
    career_router,
):
    app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/")
def health_check() -> dict:
    return {"status": "healthy", "version": settings.APP_VERSION, "timestamp": datetime.utcnow()}


@app.get("/health/ready")
def readiness(db: Annotated[Session, Depends(get_db)]) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ready"}


@app.get("/v1/auth/session", response_model=AuthenticatedUser)
def authenticated_session(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
    return user
