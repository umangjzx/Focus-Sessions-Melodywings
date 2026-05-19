from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    parent_id: int | None = None
    priority: Literal["low", "medium", "high"] = "medium"
    estimated_minutes: int = 25
    tags: list[str] | None = None
    notes: str | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Literal["low", "medium", "high"] | None = None
    estimated_minutes: int | None = None
    status: Literal["todo", "in-progress", "completed"] | None = None
    tags: list[str] | None = None
    notes: str | None = None
    parent_id: int | None = None
    due_date: datetime | None = None


class BulkAction(BaseModel):
    ids: list[int]
    action: Literal["complete", "delete", "todo", "in-progress"]


class TaskResponse(BaseModel):
    id: int
    user_id: int
    parent_id: int | None
    title: str
    description: str | None
    priority: str
    estimated_minutes: int
    status: str
    tags: list[str]
    notes: str | None
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
