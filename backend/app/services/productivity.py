def calculate_productivity_score(
    planned_minutes: int, actual_minutes: int, task_completed: bool, mood: int
) -> float:
    completion_percent = min(100.0, (actual_minutes / planned_minutes) * 100) if planned_minutes else 0
    score = completion_percent * 0.5
    if task_completed:
        score += 30
    score += mood * 4
    return round(min(100.0, score), 1)


def calculate_xp(actual_minutes: int, productivity_score: float, task_completed: bool) -> int:
    xp = int(actual_minutes * 2) + int(productivity_score / 10)
    if task_completed:
        xp += 15
    return max(5, xp)


def xp_for_level(level: int) -> int:
    return level * 100


def level_from_xp(total_xp: int) -> tuple[int, int, int]:
    level = 1
    remaining = total_xp
    while remaining >= xp_for_level(level):
        remaining -= xp_for_level(level)
        level += 1
    return level, remaining, xp_for_level(level)
