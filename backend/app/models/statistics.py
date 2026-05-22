from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class MeetingStatistics(Base):
    __tablename__ = "meeting_statistics"

    id: Mapped[int] = mapped_column(primary_key=True)

    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        unique=True
    )

    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    participants_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_count: Mapped[int] = mapped_column(Integer, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    average_focus_time: Mapped[float] = mapped_column(Float, default=0.0)
    session_duration: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    meeting = relationship("Meeting")
    host = relationship("User")


class ParticipantStatistics(Base):
    __tablename__ = "participant_statistics"

    id: Mapped[int] = mapped_column(primary_key=True)

    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )

    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    left_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    focus_duration: Mapped[int] = mapped_column(Integer, default=0)
    completion_status: Mapped[str] = mapped_column(default="incomplete")
    attendance_percentage: Mapped[float] = mapped_column(Float, default=0.0)

    meeting = relationship("Meeting")
    user = relationship("User")
