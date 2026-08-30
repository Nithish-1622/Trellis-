"""Authenticated conversational learning assistant endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import AuthenticatedUser, get_current_user
from chat_schemas import ChatMessageRequest, ChatMessageResponse
from chat_service import LearningAssistant, get_learning_assistant
from database import get_db
from rate_limit import SlidingWindowRateLimiter, get_expensive_operation_limiter


router = APIRouter(prefix="/v1/chat", tags=["learning assistant"])


def assistant_dependency(db: Annotated[Session, Depends(get_db)]) -> LearningAssistant:
    return get_learning_assistant(db)


@router.post("/messages", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest, identity: Annotated[AuthenticatedUser, Depends(get_current_user)], assistant: Annotated[LearningAssistant, Depends(assistant_dependency)], limiter: Annotated[SlidingWindowRateLimiter, Depends(get_expensive_operation_limiter)]) -> ChatMessageResponse:
    limiter.check(identity.user_id, "chat")
    return await assistant.respond(identity, request.message)
