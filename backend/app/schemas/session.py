from datetime import datetime
from pydantic import BaseModel, Field


class SessionStart(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    task_id: int | None = None
    goal: str | None = None
    planned_minutes: int = Field(ge=5, le=120)
    ambient_sound: str | None = None
    pomodoro_work: int | None = None
    pomodoro_break: int | None = None


class SessionPause(BaseModel):
    pauses: int = 0


class SessionComplete(BaseModel):
    actual_minutes: int = Field(ge=0)
    pauses: int = 0
    mood: int = Field(ge=1, le=5)
    notes: str | None = None
    task_completed: bool = False


class SessionResponse(BaseModel):
    id: int
    user_id: int
    task_id: int | None
    title: str
    goal: str | None
    planned_minutes: int
    actual_minutes: int
    pauses: int
    ambient_sound: str | None
    productivity_score: float
    mood: int | None
    notes: str | None
    xp_earned: int
    task_completed: bool
    started_at: datetime | None
    completed_at: datetime | None
    status: str
    task_title: str | None = None

    class Config:
        from_attributes = True


class SessionCompleteResult(BaseModel):
    session: SessionResponse
    xp_earned: int
    productivity_score: float
    streak: dict
    unlocked_achievements: list[dict]
