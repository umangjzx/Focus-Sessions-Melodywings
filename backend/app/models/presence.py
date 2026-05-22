from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserPresence(Base):
    __tablename__ = "user_presence"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )

    connected: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    last_seen: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    left_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    user = relationship("User")
    meeting = relationship("Meeting")

    __table_args__ = (
        Index('ix_user_presence_meeting_user', 'meeting_id', 'user_id'),
    )
