from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.session import FocusSession
from app.models.session_note import SessionNote
from app.models.task import Task
from app.models.user import User
from app.schemas.session import (
    SessionComplete,
    SessionCompleteResult,
    SessionPause,
    SessionResponse,
    SessionStart,
)
from app.services.achievements import evaluate_achievements, update_streak
from app.services.productivity import calculate_productivity_score, calculate_xp, level_from_xp

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _session_response(session: FocusSession, task_title: str | None = None) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        user_id=session.user_id,
        task_id=session.task_id,
        title=session.title,
        goal=session.goal,
        planned_minutes=session.planned_minutes,
        actual_minutes=session.actual_minutes,
        pauses=session.pauses,
        ambient_sound=session.ambient_sound,
        productivity_score=session.productivity_score,
        mood=session.mood,
        notes=session.notes,
        xp_earned=session.xp_earned,
        task_completed=session.task_completed,
        started_at=session.started_at,
        completed_at=session.completed_at,
        status=session.status,
        task_title=task_title,
    )


@router.post("/start", response_model=SessionResponse, status_code=201)
def start_session(
    data: SessionStart,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = FocusSession(
        user_id=user.id,
        task_id=data.task_id,
        title=data.title,
        goal=data.goal,
        planned_minutes=data.planned_minutes,
        ambient_sound=data.ambient_sound,
        pomodoro_work=data.pomodoro_work,
        pomodoro_break=data.pomodoro_break,
        started_at=datetime.utcnow(),
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_response(session)


@router.post("/{session_id}/pause", response_model=SessionResponse)
def pause_session(
    session_id: int,
    data: SessionPause,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "paused"
    session.pauses = data.pauses
    db.commit()
    db.refresh(session)
    return _session_response(session)


@router.post("/{session_id}/resume", response_model=SessionResponse)
def resume_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = "active"
    db.commit()
    db.refresh(session)
    return _session_response(session)


@router.post("/{session_id}/complete", response_model=SessionCompleteResult)
def complete_session(
    session_id: int,
    data: SessionComplete,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(FocusSession)
        .filter(FocusSession.id == session_id, FocusSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    score = calculate_productivity_score(
        session.planned_minutes, data.actual_minutes, data.task_completed, data.mood
    )
    xp = calculate_xp(data.actual_minutes, score, data.task_completed)

    session.actual_minutes = data.actual_minutes
    session.pauses = data.pauses
    session.mood = data.mood
    session.notes = data.notes
    session.task_completed = data.task_completed
    session.productivity_score = score
    session.xp_earned = xp
    session.completed_at = datetime.utcnow()
    session.status = "completed"

    if data.task_completed and session.task_id:
        task = db.query(Task).filter(Task.id == session.task_id).first()
        if task:
            task.status = "completed"

    streak = update_streak(db, user.id)
    level, _, _ = level_from_xp(streak.total_xp + xp)
    streak.total_xp += xp
    streak.level = level

    if data.notes:
        db.add(SessionNote(user_id=user.id, session_id=session.id, content=data.notes))

    unlocked = evaluate_achievements(db, user.id)
    db.commit()
    db.refresh(session)

    task_title = None
    if session.task_id:
        t = db.query(Task).filter(Task.id == session.task_id).first()
        task_title = t.title if t else None

    return SessionCompleteResult(
        session=_session_response(session, task_title),
        xp_earned=xp,
        productivity_score=score,
        streak={
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "total_xp": streak.total_xp,
            "level": streak.level,
        },
        unlocked_achievements=unlocked,
    )


@router.get("/history", response_model=list[SessionResponse])
def session_history(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .order_by(FocusSession.completed_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for s in sessions:
        task_title = None
        if s.task_id:
            t = db.query(Task).filter(Task.id == s.task_id).first()
            task_title = t.title if t else None
        result.append(_session_response(s, task_title))
    return result
