from random import choices
from string import ascii_uppercase, digits

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.meeting import Meeting, MeetingParticipant
from app.models.user import User
from app.services.meeting_sync import build_meeting_sync, _participants_payload

router = APIRouter()

JOINABLE_STATUSES = (
    "WAITING", "PAUSED", "RUNNING", "CREATED",
    "waiting", "paused", "running", "started", "created",
)


def generate_room_code(length: int = 6):
    return "".join(choices(ascii_uppercase + digits, k=length))


def _normalize_code(room_code: str) -> str:
    return room_code.strip().upper()


def _find_meeting_by_code(db: Session, room_code: str) -> Meeting | None:
    code = _normalize_code(room_code)
    return (
        db.query(Meeting)
        .filter(func.upper(Meeting.room_code) == code)
        .first()
    )


def _latest_available_meeting(db: Session) -> Meeting | None:
    return (
        db.query(Meeting)
        .filter(Meeting.status.in_(JOINABLE_STATUSES))
        .order_by(Meeting.created_at.desc())
        .first()
    )


def _meeting_preview(meeting: Meeting, db: Session) -> dict:
    sync = build_meeting_sync(db, meeting)
    return {
        "id": sync["id"],
        "title": sync["title"],
        "room_code": sync["room_code"],
        "host_id": sync["host_id"],
        "host_name": sync["host_name"],
        "status": sync["status"],
        "participant_count": sync["participant_count"],
        "ready_count": sync["ready_count"],
        "online_count": sync["online_count"],
        "remaining_seconds": sync["remaining_seconds"],
        "duration_minutes": sync["duration_minutes"],
        "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
    }


def _join_user_to_meeting(db: Session, meeting: Meeting, user: User) -> dict:
    existing = (
        db.query(MeetingParticipant)
        .filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.user_id == user.id,
        )
        .first()
    )

    if not existing:
        db.add(
            MeetingParticipant(
                meeting_id=meeting.id,
                user_id=user.id,
                is_ready=False,
            )
        )
        db.commit()

    return {
        "message": "Already joined" if existing else "Joined successfully",
        "room_code": meeting.room_code,
        "meeting": _meeting_preview(meeting, db),
    }


@router.post("/create")
def create_meeting(
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room_code = generate_room_code()

    while db.query(Meeting).filter(Meeting.room_code == room_code).first():
        room_code = generate_room_code()

    meeting = Meeting(
        title=title,
        room_code=room_code,
        host_id=current_user.id,
        status="WAITING",
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    db.add(
        MeetingParticipant(
            meeting_id=meeting.id,
            user_id=current_user.id,
            is_ready=False,
        )
    )
    db.commit()

    preview = _meeting_preview(meeting, db)
    return {
        "meeting_id": meeting.id,
        "room_code": meeting.room_code,
        "host_id": meeting.host_id,
        "status": meeting.status,
        "meeting": preview,
    }


@router.get("/latest/available")
def get_latest_available(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _latest_available_meeting(db)
    if not meeting:
        raise HTTPException(status_code=404, detail="No active focus rooms right now")

    return _meeting_preview(meeting, db)


@router.post("/join-latest")
def join_latest_meeting(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _latest_available_meeting(db)
    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="No active focus rooms. Ask a host to create one first.",
        )

    return _join_user_to_meeting(db, meeting, current_user)


@router.post("/join/{room_code}")
def join_meeting(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if (meeting.status or "").upper() == "COMPLETED":
        raise HTTPException(status_code=400, detail="This meeting has already ended")

    return _join_user_to_meeting(db, meeting, current_user)


@router.get("/{room_code}/state")
def get_meeting_state(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return build_meeting_sync(db, meeting)


@router.get("/{room_code}/summary")
def get_meeting_summary(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    sync = build_meeting_sync(db, meeting)
    duration_min = meeting.meeting_duration or 0
    if duration_min == 0 and meeting.meeting_start_time and meeting.remaining_time is not None:
        duration_min = max(1, round((duration_min * 60 or 0) / 60))

    focused_min = duration_min
    if meeting.meeting_duration and meeting.remaining_time is not None:
        elapsed_sec = (meeting.meeting_duration * 60) - max(0, meeting.remaining_time)
        focused_min = max(1, round(elapsed_sec / 60)) if elapsed_sec > 0 else duration_min

    return {
        "title": meeting.title,
        "room_code": meeting.room_code,
        "status": sync["status"],
        "participant_count": sync["participant_count"],
        "duration_minutes": meeting.meeting_duration or focused_min,
        "focused_minutes": focused_min if sync["status"] == "COMPLETED" else None,
        "host_name": sync["host_name"],
    }


@router.get("/{room_code}")
def get_meeting(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return _meeting_preview(meeting, db)


@router.post("/{room_code}/start")
def start_meeting(
    room_code: str,
    duration_minutes: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can start the meeting")

    meeting.status = "RUNNING"
    meeting.meeting_start_time = datetime.utcnow()
    meeting.meeting_duration = duration_minutes
    meeting.remaining_time = duration_minutes * 60

    for p in db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting.id):
        p.is_ready = False

    db.commit()

    return {
        "status": meeting.status,
        "started_at": datetime.utcnow().isoformat() + "Z",
        "duration_minutes": duration_minutes,
        "room_code": meeting.room_code,
        "remaining_seconds": meeting.remaining_time,
    }


@router.get("/{room_code}/participants")
def get_participants(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = _find_meeting_by_code(db, room_code)

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return _participants_payload(db, meeting)
