import uuid
from datetime import datetime

from pydantic import BaseModel


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    is_completed: bool
    assignee_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectUpdateResponse(BaseModel):
    id: uuid.UUID
    content: str
    update_type: str
    author_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    status: str
    health: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectListResponse):
    tasks: list[TaskResponse] = []
    updates: list[ProjectUpdateResponse] = []
