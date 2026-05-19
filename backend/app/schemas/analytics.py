from pydantic import BaseModel


class DashboardStats(BaseModel):
    today_focus_minutes: int
    tasks_completed_today: int
    current_streak: int
    longest_streak: int
    total_xp: int
    level: int
    total_sessions: int
    average_session_minutes: int
    recommended_duration: int


class WeeklyStats(BaseModel):
    labels: list[str]
    minutes: list[int]


class HeatmapHour(BaseModel):
    hour: int
    count: int
    minutes: int


class AnalyticsHeatmap(BaseModel):
    heatmap: list[HeatmapHour]
    music_stats: list[dict]
    completion_rate: int


class MonthlyStat(BaseModel):
    month: str
    minutes: int
    sessions: int
