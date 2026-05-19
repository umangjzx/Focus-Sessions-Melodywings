from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserSettings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    default_duration: Mapped[int] = mapped_column(Integer, default=25)
    theme: Mapped[str] = mapped_column(String(30), default="dark")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_start_breaks: Mapped[bool] = mapped_column(Boolean, default=True)
    preferred_sound: Mapped[str | None] = mapped_column(String(80), nullable=True)
    sound_volume: Mapped[int] = mapped_column(Integer, default=80)
    pomodoro_work: Mapped[int] = mapped_column(Integer, default=25)
    pomodoro_break: Mapped[int] = mapped_column(Integer, default=5)
    ai_coach_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User", back_populates="settings")
