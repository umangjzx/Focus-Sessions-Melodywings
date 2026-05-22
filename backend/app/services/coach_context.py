"""Build personalized coach context from the user's Focus Sessions data."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.achievement import Achievement
from app.models.session import FocusSession
from app.models.settings import UserSettings
from app.models.streak import Streak
from app.models.task import Task
from app.models.user import User


def build_coach_context(
    user: User,
    db: Session,
    *,
    page: str | None = None,
    planned_minutes: int | None = None,
    session_title: str | None = None,
    task_title: str | None = None,
    goal: str | None = None,
    in_focus_session: bool | None = None,
) -> dict:
    today = date.today()
    week_start = today - timedelta(days=6)

    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()

    today_focus = int(
        db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            func.date(FocusSession.completed_at) == today,
        )
        .scalar()
        or 0
    )

    week_focus = int(
        db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            func.date(FocusSession.completed_at) >= week_start,
        )
        .scalar()
        or 0
    )

    week_sessions = int(
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            func.date(FocusSession.completed_at) >= week_start,
        )
        .scalar()
        or 0
    )

    tasks_today = int(
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user.id,
            Task.status == "completed",
            func.date(Task.updated_at) == today,
        )
        .scalar()
        or 0
    )

    pending_tasks = (
        db.query(Task)
        .filter(Task.user_id == user.id, Task.status.in_(("todo", "in_progress")))
        .order_by(Task.priority.desc(), Task.sort_order, Task.created_at)
        .limit(8)
        .all()
    )

    overdue_count = int(
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user.id,
            Task.status.in_(("todo", "in_progress")),
            Task.due_date.isnot(None),
            Task.due_date < datetime.utcnow(),
        )
        .scalar()
        or 0
    )

    active_session = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user.id, FocusSession.status == "active")
        .order_by(FocusSession.started_at.desc())
        .first()
    )

    last_completed = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .order_by(FocusSession.completed_at.desc())
        .limit(1)
        .first()
    )

    recent_sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .order_by(FocusSession.completed_at.desc())
        .limit(3)
        .all()
    )

    total_sessions = int(
        db.query(func.count(FocusSession.id))
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .scalar()
        or 0
    )

    avg_duration = int(
        db.query(func.coalesce(func.avg(FocusSession.actual_minutes), 0))
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .scalar()
        or 0
    )

    badges = (
        db.query(Achievement)
        .filter(Achievement.user_id == user.id)
        .order_by(Achievement.earned_at.desc())
        .limit(5)
        .all()
    )

    recommended = 25 if today_focus < 60 else (45 if today_focus < 120 else 50)

    ctx: dict = {
        "name": user.name,
        "current_streak": streak.current_streak if streak else 0,
        "longest_streak": streak.longest_streak if streak else 0,
        "total_xp": streak.total_xp if streak else 0,
        "level": streak.level if streak else 1,
        "today_focus_minutes": today_focus,
        "week_focus_minutes": week_focus,
        "week_sessions": week_sessions,
        "tasks_completed_today": tasks_today,
        "pending_task_count": len(pending_tasks),
        "overdue_task_count": overdue_count,
        "pending_tasks": [
            {
                "title": t.title,
                "priority": t.priority,
                "status": t.status,
                "estimated_minutes": t.estimated_minutes,
            }
            for t in pending_tasks
        ],
        "total_sessions": total_sessions,
        "average_session_minutes": avg_duration,
        "recommended_duration": recommended,
        "default_duration": settings.default_duration if settings else 25,
        "pomodoro_work": settings.pomodoro_work if settings else 25,
        "pomodoro_break": settings.pomodoro_break if settings else 5,
        "auto_start_breaks": settings.auto_start_breaks if settings else True,
        "preferred_sound": settings.preferred_sound if settings else None,
        "recent_badges": [b.badge_name for b in badges],
        "page": page,
        "planned_minutes": planned_minutes,
        "session_title": session_title,
        "task_title": task_title,
        "goal": goal,
        "in_focus_session": in_focus_session,
    }

    if active_session:
        task_name = None
        if active_session.task_id:
            task = db.query(Task).filter(Task.id == active_session.task_id).first()
            task_name = task.title if task else None
        ctx["active_session"] = {
            "title": active_session.title,
            "goal": active_session.goal,
            "planned_minutes": active_session.planned_minutes,
            "actual_minutes": active_session.actual_minutes,
            "pauses": active_session.pauses,
            "task_title": task_name,
            "ambient_sound": active_session.ambient_sound,
        }

    if last_completed:
        ctx["last_session"] = {
            "title": last_completed.title,
            "actual_minutes": last_completed.actual_minutes,
            "productivity_score": round(last_completed.productivity_score, 1),
            "mood": last_completed.mood,
            "task_completed": last_completed.task_completed,
        }

    if recent_sessions:
        ctx["recent_sessions"] = [
            {"title": s.title, "minutes": s.actual_minutes}
            for s in recent_sessions
        ]

    return ctx


def format_context_for_prompt(context: dict | None) -> str:
    """Turn context dict into a compact block for the LLM system prompt."""
    if not context:
        return ""

    lines = [
        "=== USER DATA FROM FOCUS SESSIONS APP (use this to personalize every reply) ===",
        f"Name: {context.get('name', 'User')}",
        f"Level {context.get('level', 1)} · {context.get('total_xp', 0)} XP · "
        f"streak {context.get('current_streak', 0)} days (best {context.get('longest_streak', 0)})",
        f"Today: {context.get('today_focus_minutes', 0)} min focused, "
        f"{context.get('tasks_completed_today', 0)} tasks done",
        f"This week: {context.get('week_focus_minutes', 0)} min across "
        f"{context.get('week_sessions', 0)} sessions",
        f"All time: {context.get('total_sessions', 0)} sessions, "
        f"avg {context.get('average_session_minutes', 0)} min",
        f"Settings: default {context.get('default_duration', 25)} min session, "
        f"Pomodoro {context.get('pomodoro_work', 25)}/{context.get('pomodoro_break', 5)}, "
        f"auto-breaks={'yes' if context.get('auto_start_breaks') else 'no'}",
        f"Coach recommends next session: {context.get('recommended_duration', 25)} min",
    ]

    if context.get("preferred_sound"):
        lines.append(f"Preferred ambient sound: {context['preferred_sound']}")

    pending = context.get("pending_tasks") or []
    if pending:
        task_lines = ", ".join(
            f"{t['title']} ({t['priority']}, {t['estimated_minutes']}m)"
            for t in pending[:6]
        )
        lines.append(
            f"Open tasks ({context.get('pending_task_count', len(pending))}): {task_lines}"
        )
    else:
        lines.append("Open tasks: none")

    if context.get("overdue_task_count"):
        lines.append(f"Overdue tasks: {context['overdue_task_count']}")

    if context.get("recent_badges"):
        lines.append(f"Recent badges: {', '.join(context['recent_badges'])}")

    if context.get("active_session"):
        s = context["active_session"]
        lines.append(
            f"ACTIVE SESSION NOW: \"{s.get('title')}\" "
            f"({s.get('planned_minutes')} min planned, {s.get('actual_minutes')} min so far, "
            f"{s.get('pauses', 0)} pauses)"
        )
        if s.get("task_title"):
            lines.append(f"Linked task: {s['task_title']}")
        if s.get("goal"):
            lines.append(f"Session goal: {s['goal']}")

    if context.get("last_session"):
        s = context["last_session"]
        lines.append(
            f"Last completed session: \"{s.get('title')}\" — {s.get('actual_minutes')} min, "
            f"score {s.get('productivity_score')}"
        )

    if context.get("recent_sessions"):
        recent = ", ".join(
            f"\"{r['title']}\" ({r['minutes']}m)" for r in context["recent_sessions"]
        )
        lines.append(f"Recent sessions: {recent}")

    if context.get("page"):
        lines.append(f"User is on app page: {context['page']}")

    if context.get("in_focus_session"):
        lines.append("User is currently in a live focus timer.")

    if context.get("planned_minutes") and not context.get("active_session"):
        lines.append(f"Planning a {context['planned_minutes']} min session")

    if context.get("session_title"):
        lines.append(f"Planned session title: {context['session_title']}")

    if context.get("task_title"):
        lines.append(f"Selected task: {context['task_title']}")

    if context.get("goal"):
        lines.append(f"Session goal they wrote: {context['goal']}")

    lines.append(
        "Always reference their real numbers, tasks, and session state when relevant. "
        "Do not invent stats."
    )
    lines.append("=== END USER DATA ===")
    return "\n".join(lines)
