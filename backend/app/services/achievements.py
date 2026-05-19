from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.achievement import Achievement
from app.models.session import FocusSession
from app.models.streak import Streak
from app.models.task import Task

ACHIEVEMENT_DEFS = [
    ("First Focus Session", "Complete your first focus session", lambda c: c["sessions"] >= 1),
    ("5 Sessions Completed", "Complete 5 focus sessions", lambda c: c["sessions"] >= 5),
    ("7-Day Streak", "Maintain a 7-day focus streak", lambda c: c["streak"] >= 7),
    ("25 Hours Focused", "Accumulate 25 hours of focus time", lambda c: c["minutes"] >= 25 * 60),
    ("100 Tasks Completed", "Complete 100 tasks", lambda c: c["tasks"] >= 100),
]


def update_streak(db: Session, user_id: int) -> Streak:
    today = date.today()
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    if not streak:
        streak = Streak(user_id=user_id, current_streak=1, longest_streak=1, last_focus_date=today)
        db.add(streak)
        return streak

    if streak.last_focus_date == today:
        return streak

    yesterday = today - timedelta(days=1)
    if streak.last_focus_date == yesterday:
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_focus_date = today
    return streak


def evaluate_achievements(db: Session, user_id: int) -> list[dict]:
    sessions = (
        db.query(func.count(FocusSession.id))
        .filter(FocusSession.user_id == user_id, FocusSession.status == "completed")
        .scalar()
        or 0
    )
    minutes = (
        db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0))
        .filter(FocusSession.user_id == user_id, FocusSession.status == "completed")
        .scalar()
        or 0
    )
    streak_row = db.query(Streak).filter(Streak.user_id == user_id).first()
    tasks = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.status == "completed")
        .scalar()
        or 0
    )

    ctx = {
        "sessions": sessions,
        "minutes": minutes,
        "streak": streak_row.current_streak if streak_row else 0,
        "tasks": tasks,
    }

    unlocked = []
    for badge_name, description, check in ACHIEVEMENT_DEFS:
        if not check(ctx):
            continue
        existing = (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id, Achievement.badge_name == badge_name)
            .first()
        )
        if existing:
            continue
        ach = Achievement(user_id=user_id, badge_name=badge_name, description=description)
        db.add(ach)
        unlocked.append({"badge_name": badge_name, "description": description})
    return unlocked
