from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    planned_minutes: Mapped[int] = mapped_column(Integer)
    actual_minutes: Mapped[int] = mapped_column(Integer, default=0)
    pauses: Mapped[int] = mapped_column(Integer, default=0)
    ambient_sound: Mapped[str | None] = mapped_column(String(80), nullable=True)
    pomodoro_work: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pomodoro_break: Mapped[int | None] = mapped_column(Integer, nullable=True)
    productivity_score: Mapped[float] = mapped_column(Float, default=0.0)
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    task_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")

    user = relationship("User", back_populates="sessions")
    task = relationship("Task", back_populates="sessions")
    session_notes = relationship("SessionNote", back_populates="session", cascade="all, delete-orphan")
