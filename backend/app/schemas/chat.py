import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str
    conversation_id: str | None = None


class Source(BaseModel):
    filename: str | None
    score: float
    content_preview: str


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: list[Source] = []
    title: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    sources: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    conversation_id: str
    conversation_title: str | None
    message_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
