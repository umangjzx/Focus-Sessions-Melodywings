import uuid
from datetime import datetime

from app.core.database import SessionLocal
from app.models.meeting import Meeting, MeetingParticipant
from app.models.user import User


def generate_room_code(length: int = 8) -> str:
    """Generate a unique room code consisting of uppercase alphanumeric characters."""
    return uuid.uuid4().hex.upper()[:length]


def create_meeting(host_id: int, title: str, duration_minutes: int = 25) -> Meeting:
    """Create a new meeting and persist it to the database.

    Args:
        host_id: ID of the user who creates the meeting (host).
        title: Human‑readable title for the meeting.
        duration_minutes: Planned duration in minutes.
    Returns:
        The newly created :class:`Meeting` instance.
    """
    with SessionLocal() as db:
        # Ensure uniqueness of room code
        while True:
            room_code = generate_room_code()
            existing = db.query(Meeting).filter(Meeting.room_code == room_code).first()
            if not existing:
                break
        meeting = Meeting(
            title=title,
            room_code=room_code,
            host_id=host_id,
            meeting_duration=duration_minutes,
            status="CREATED",
            created_at=datetime.utcnow(),
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting


def add_participant(meeting_id: int, user_id: int) -> MeetingParticipant:
    """Add a user as a participant to a meeting.

    This will create a ``MeetingParticipant`` row if one does not already exist.
    """
    with SessionLocal() as db:
        # Prevent duplicates
        existing = (
            db.query(MeetingParticipant)
            .filter(
                MeetingParticipant.meeting_id == meeting_id,
                MeetingParticipant.user_id == user_id,
            )
            .first()
        )
        if existing:
            return existing
        participant = MeetingParticipant(meeting_id=meeting_id, user_id=user_id)
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant


def get_meeting_by_code(room_code: str) -> Meeting | None:
    """Retrieve a meeting instance by its room code."""
    with SessionLocal() as db:
        return db.query(Meeting).filter(Meeting.room_code == room_code).first()
