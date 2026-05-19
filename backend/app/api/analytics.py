import time
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.session import FocusSession
from app.models.streak import Streak
from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import AnalyticsHeatmap, DashboardStats, HeatmapHour, MonthlyStat, WeeklyStats

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_cache = {}
CACHE_TTL = 300  # 5 minutes

@router.get("/dashboard", response_model=DashboardStats)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cache_key = f"dashboard_{user.id}"
    if cache_key in _cache:
        val, ts = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return val

    today = date.today()
    today_focus = (
        db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            func.date(FocusSession.completed_at) == today,
        )
        .scalar()
    )
    tasks_today = (
        db.query(func.count(Task.id))
        .filter(
            Task.user_id == user.id,
            Task.status == "completed",
            func.date(Task.updated_at) == today,
        )
        .scalar()
        or 0
    )
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    total_sessions = (
        db.query(func.count(FocusSession.id))
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .scalar()
        or 0
    )
    avg_duration = (
        db.query(func.coalesce(func.avg(FocusSession.actual_minutes), 0))
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .scalar()
    )
    today_focus = int(today_focus or 0)
    recommended = 25 if today_focus < 60 else (45 if today_focus < 120 else 50)

    result = DashboardStats(
        today_focus_minutes=today_focus,
        tasks_completed_today=tasks_today,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        total_xp=streak.total_xp if streak else 0,
        level=streak.level if streak else 1,
        total_sessions=total_sessions,
        average_session_minutes=int(avg_duration or 0),
        recommended_duration=recommended,
    )
    _cache[cache_key] = (result, time.time())
    return result


@router.get("/weekly", response_model=WeeklyStats)
def weekly(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    labels = []
    minutes = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        labels.append(d.strftime("%a"))
        day_min = (
            db.query(func.coalesce(func.sum(FocusSession.actual_minutes), 0))
            .filter(
                FocusSession.user_id == user.id,
                FocusSession.status == "completed",
                func.date(FocusSession.completed_at) == d,
            )
            .scalar()
        )
        minutes.append(int(day_min or 0))
    return WeeklyStats(labels=labels, minutes=minutes)


@router.get("/monthly", response_model=list[MonthlyStat])
def monthly(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = date.today() - timedelta(days=180)
    dialect = db.bind.dialect.name if db.bind is not None else "sqlite"
    if dialect == "sqlite":
        month_expr = func.strftime("%Y-%m", FocusSession.completed_at)
    else:
        month_expr = func.to_char(FocusSession.completed_at, "YYYY-MM")
    rows = (
        db.query(
            month_expr.label("month"),
            func.sum(FocusSession.actual_minutes).label("minutes"),
            func.count(FocusSession.id).label("sessions"),
        )
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            func.date(FocusSession.completed_at) >= since,
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [
        MonthlyStat(month=r.month, minutes=int(r.minutes or 0), sessions=int(r.sessions or 0))
        for r in rows
    ]


@router.get("/heatmap", response_model=AnalyticsHeatmap)
def heatmap(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cache_key = f"heatmap_{user.id}"
    if cache_key in _cache:
        val, ts = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return val

    dialect = db.bind.dialect.name if db.bind is not None else "sqlite"
    if dialect == "sqlite":
        hour_expr = func.strftime("%H", FocusSession.started_at)
    else:
        hour_expr = func.extract("hour", FocusSession.started_at)
    rows = (
        db.query(
            hour_expr.label("hour"),
            func.count(FocusSession.id).label("count"),
            func.sum(FocusSession.actual_minutes).label("minutes"),
        )
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            FocusSession.started_at.isnot(None),
        )
        .group_by("hour")
        .all()
    )
    hour_map = {int(r.hour): {"count": r.count, "minutes": int(r.minutes or 0)} for r in rows}
    heatmap_data = [
        HeatmapHour(
            hour=h,
            count=hour_map.get(h, {}).get("count", 0),
            minutes=hour_map.get(h, {}).get("minutes", 0),
        )
        for h in range(24)
    ]

    sound_rows = (
        db.query(FocusSession.ambient_sound, func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            FocusSession.ambient_sound.isnot(None),
        )
        .group_by(FocusSession.ambient_sound)
        .order_by(func.count(FocusSession.id).desc())
        .limit(5)
        .all()
    )
    total = (
        db.query(func.count(FocusSession.id))
        .filter(FocusSession.user_id == user.id, FocusSession.status == "completed")
        .scalar()
        or 0
    )
    completed_with_task = (
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            FocusSession.task_completed.is_(True),
        )
        .scalar()
        or 0
    )
    rate = int((completed_with_task / total) * 100) if total else 0

    result = AnalyticsHeatmap(
        heatmap=heatmap_data,
        music_stats=[{"sound": r[0], "count": r[1]} for r in sound_rows],
        completion_rate=rate,
    )
    _cache[cache_key] = (result, time.time())
    return result
