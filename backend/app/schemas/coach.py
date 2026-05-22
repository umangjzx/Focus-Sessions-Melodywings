from typing import Literal

from pydantic import BaseModel, Field


class CoachClientContext(BaseModel):
    """Optional live hints from the frontend (merged with DB snapshot)."""

    page: str | None = Field(None, max_length=80)
    planned_minutes: int | None = Field(None, ge=1, le=480)
    session_title: str | None = Field(None, max_length=255)
    task_title: str | None = Field(None, max_length=255)
    goal: str | None = Field(None, max_length=500)
    in_focus_session: bool | None = None


class CoachChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class CoachChatRequest(BaseModel):
    messages: list[CoachChatMessage] = Field(..., min_length=1, max_length=30)
    client: CoachClientContext | None = None


class CoachChatResponse(BaseModel):
    message: str
    source: str
