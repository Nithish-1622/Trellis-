"""Contracts for the contextual learning assistant and typed actions."""

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class AssistantAction(BaseModel):
    action_type: str
    label: str
    payload: dict = Field(default_factory=dict)
    requires_confirmation: bool = False


class AssistantDraft(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    actions: list[AssistantAction] = Field(default_factory=list, max_length=5)
    suggestions: list[str] = Field(default_factory=list, max_length=5)


class ChatMessageResponse(AssistantDraft):
    context: dict
