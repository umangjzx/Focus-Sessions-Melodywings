"""Build meeting room sync payloads for REST and Socket.IO."""

from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingParticipant
from app.models.presence import UserPresence
from app.models.user import User


def _participants_payload(db: Session, meeting: Meeting) -> list[dict]:
    rows = (
        db.query(MeetingParticipant)
        .filter(MeetingParticipant.meeting_id == meeting.id)
        .all()
    )
    result = []
    for row in rows:
        user = db.query(User).filter(User.id == row.user_id).first()
        if not user:
            continue
        presence = (
            db.query(UserPresence)
            .filter(
                UserPresence.meeting_id == meeting.id,
                UserPresence.user_id == user.id,
                UserPresence.connected == True,
            )
            .first()
        )
        result.append(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_host": user.id == meeting.host_id,
                "is_ready": bool(row.is_ready),
                "online": presence is not None,
            }
        )
    return result


def build_meeting_sync(db: Session, meeting: Meeting) -> dict:
    participants = _participants_payload(db, meeting)
    host = db.query(User).filter(User.id == meeting.host_id).first()
    ready_count = sum(1 for p in participants if p["is_ready"])
    online_count = sum(1 for p in participants if p["online"])

    return {
        "id": meeting.id,
        "title": meeting.title,
        "room_code": meeting.room_code,
        "host_id": meeting.host_id,
        "host_name": host.name if host else None,
        "status": (meeting.status or "WAITING").upper(),
        "remaining_seconds": meeting.remaining_time,
        "duration_minutes": meeting.meeting_duration,
        "participant_count": len(participants),
        "ready_count": ready_count,
        "online_count": online_count,
        "participants": participants,
    }
