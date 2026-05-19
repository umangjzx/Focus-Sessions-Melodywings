from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    default_duration: int | None = None
    theme: str | None = None
    notifications_enabled: bool | None = None
    auto_start_breaks: bool | None = None
    preferred_sound: str | None = None
    sound_volume: int | None = None
    pomodoro_work: int | None = None
    pomodoro_break: int | None = None
    ai_coach_enabled: bool | None = None


class SettingsResponse(BaseModel):
    default_duration: int
    theme: str
    notifications_enabled: bool
    auto_start_breaks: bool
    preferred_sound: str | None
    sound_volume: int
    pomodoro_work: int
    pomodoro_break: int
    ai_coach_enabled: bool

    class Config:
        from_attributes = True
