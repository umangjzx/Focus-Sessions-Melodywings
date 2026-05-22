from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String(255))

    room_code: Mapped[str] = mapped_column(
        String(10),
        unique=True
    )

    host_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="WAITING"
    )

    meeting_start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    meeting_duration: Mapped[int] = mapped_column(
        nullable=True
    )

    remaining_time: Mapped[int] = mapped_column(
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    participants = relationship(
        "MeetingParticipant",
        back_populates="meeting",
        cascade="all, delete"
    )


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id: Mapped[int] = mapped_column(primary_key=True)

    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id")
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    is_ready: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting = relationship(
        "Meeting",
        back_populates="participants"
    )