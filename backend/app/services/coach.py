import random

PRE_SESSION = [
    "Let's tackle this one step at a time. You've got this.",
    "Showing up is the hardest part — and you're here.",
    "Pick one small win. That's enough for now.",
]

MID_SESSION = [
    "You're still here. That counts.",
    "Breathe. Refocus. One minute at a time.",
    "Distractions happen. Coming back is the skill.",
]

END_SESSION = [
    "Reflect on what worked — not just what didn't.",
    "Every session builds your focus muscle.",
    "Rest is part of productivity too.",
]

SUGGESTIONS = [
    "Try a shorter session next time if starting felt hard.",
    "Schedule focus blocks at your most productive hour.",
    "Link sessions to a single clear task.",
]


def coach_message(phase: str) -> str:
    pools = {
        "pre": PRE_SESSION,
        "mid": MID_SESSION,
        "end": END_SESSION,
        "suggestion": SUGGESTIONS,
    }
    return random.choice(pools.get(phase, PRE_SESSION))
