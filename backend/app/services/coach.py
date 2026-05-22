"""Focus coach — Ollama (local LLM) with static fallback."""

from __future__ import annotations

import logging
import random
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.services.coach_context import format_context_for_prompt

logger = logging.getLogger(__name__)

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

PHASE_PROMPTS = {
    "pre": (
        "The user is about to start a focus session. Give one short, warm sentence "
        "to help them begin without pressure. ADHD-friendly."
    ),
    "mid": (
        "The user is in the middle of a focus session. Give one short encouragement "
        "to stay present. No guilt. ADHD-friendly."
    ),
    "end": (
        "The user just finished a focus session. Give one short reflective sentence "
        "celebrating effort, not perfection. ADHD-friendly."
    ),
    "suggestion": (
        "Give one practical productivity tip for someone with ADHD. "
        "One sentence only."
    ),
}


@dataclass
class CoachResult:
    message: str
    source: str  # "ollama" | "fallback"


def _fallback_message(phase: str) -> str:
    pools = {
        "pre": PRE_SESSION,
        "mid": MID_SESSION,
        "end": END_SESSION,
        "suggestion": SUGGESTIONS,
    }
    return random.choice(pools.get(phase, PRE_SESSION))


def _build_user_prompt(phase: str, context: dict | None) -> str:
    parts = [PHASE_PROMPTS.get(phase, PHASE_PROMPTS["pre"])]
    block = format_context_for_prompt(context)
    if block:
        parts.append(block)
    parts.append("Reply with only the coach message, max 25 words, no quotes or labels.")
    return "\n\n".join(parts)


def _ollama_generate(prompt: str) -> str | None:
    """Call Ollama /api/chat. Returns None if unavailable or on error."""
    if not settings.ollama_enabled:
        return None

    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {
                "role": "system",
                "content": _build_system_prompt(context),
            },
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {
            "temperature": settings.ollama_temperature,
            "num_predict": settings.ollama_max_tokens,
        },
    }

    try:
        with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            content = (data.get("message") or {}).get("content", "").strip()
            if content:
                # Use first sentence if model is verbose
                first = content.split("\n")[0].strip()
                if len(first) > 280:
                    first = first[:277] + "..."
                return first
    except httpx.HTTPError as exc:
        logger.warning("Ollama coach request failed: %s", exc)
    except Exception as exc:
        logger.warning("Ollama coach error: %s", exc)

    return None


def ollama_available() -> bool:
    """Quick check that Ollama is reachable and model is listed."""
    if not settings.ollama_enabled:
        return False
    try:
        url = f"{settings.ollama_base_url.rstrip('/')}/api/tags"
        with httpx.Client(timeout=3.0) as client:
            response = client.get(url)
            response.raise_for_status()
            models = response.json().get("models") or []
            names = {m.get("name", "") for m in models}
            target = settings.ollama_model
            return any(
                n == target or n.startswith(f"{target}:")
                for n in names
            )
    except Exception:
        return False


def _build_system_prompt(context: dict | None) -> str:
    parts = [
        "You are a gentle focus coach for people with ADHD in the Focus Sessions app. "
        "Be warm, practical, and concise. Never write code unless the user explicitly asks. "
        "Help with focus, motivation, task breakdown, and session planning. "
        "Personalize every reply using the user's real app data below — mention their streak, "
        "tasks, session history, or current session when it helps."
    ]
    block = format_context_for_prompt(context)
    if block:
        parts.append(block)
    return "\n\n".join(parts)


def _ollama_chat(messages: list[dict]) -> str | None:
    """Multi-turn chat via Ollama /api/chat."""
    if not settings.ollama_enabled:
        return None

    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
    payload = {
        "model": settings.ollama_model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": settings.ollama_temperature,
            "num_predict": min(settings.ollama_max_tokens * 3, 256),
        },
    }

    chat_timeout = max(settings.ollama_timeout_seconds, 60.0)
    try:
        with httpx.Client(timeout=chat_timeout) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            content = (data.get("message") or {}).get("content", "").strip()
            if content:
                if len(content) > 1200:
                    content = content[:1197] + "..."
                return content
    except httpx.HTTPError as exc:
        logger.warning("Ollama coach chat failed: %s", exc)
    except Exception as exc:
        logger.warning("Ollama coach chat error: %s", exc)

    return None


CHAT_FALLBACK = [
    "I'm here to help you focus. What's on your mind right now?",
    "Try naming one small task you can finish in the next 25 minutes.",
    "A short break can help — then come back to one clear goal.",
]


def personalized_greeting(context: dict | None) -> str:
    ctx = context or {}
    name = ctx.get("name") or "there"
    streak = ctx.get("current_streak", 0)
    today = ctx.get("today_focus_minutes", 0)
    pending = ctx.get("pending_task_count", 0)
    recommended = ctx.get("recommended_duration", 25)
    tasks = ctx.get("pending_tasks") or []
    top_task = tasks[0]["title"] if tasks else None

    if ctx.get("active_session"):
        title = ctx["active_session"].get("title", "your session")
        return f"Hi {name}! You're in \"{title}\" — ask me anything if you need a nudge."

    if top_task and today < 30:
        return (
            f"Hi {name}! {streak}-day streak · {today}m today. "
            f"Top task: \"{top_task}\" — want help starting a {recommended} min block?"
        )
    if pending and today < 30:
        return (
            f"Hi {name}! {pending} open task{'s' if pending != 1 else ''}, "
            f"{today}m focused today, {streak}-day streak. What should we tackle next?"
        )
    if streak and today > 0:
        return (
            f"Hi {name}! {today}m today · {streak}-day streak · "
            f"{ctx.get('total_sessions', 0)} sessions. What do you want to focus on?"
        )
    if streak:
        return f"Hi {name}! {streak}-day streak — try a {recommended} min session when you're ready."
    return f"Hi {name}! Ask me about your tasks, streak, or next session."


def coach_chat(history: list[dict], context: dict | None = None) -> CoachResult:
    """Reply in a multi-turn coach conversation."""
    system = {"role": "system", "content": _build_system_prompt(context)}
    ollama_messages = [system]

    for item in history[-20:]:
        role = item.get("role", "user")
        if role not in ("user", "assistant"):
            continue
        content = (item.get("content") or "").strip()
        if not content:
            continue
        ollama_messages.append({"role": role, "content": content[:2000]})

    if len(ollama_messages) == 1:
        return CoachResult(message=personalized_greeting(context), source="fallback")

    llm_text = _ollama_chat(ollama_messages)
    if llm_text:
        return CoachResult(message=llm_text, source="ollama")

    return CoachResult(message=random.choice(CHAT_FALLBACK), source="fallback")


def coach_message(phase: str, context: dict | None = None) -> CoachResult:
    """
    Generate a coach message for phase: pre | mid | end | suggestion.
    Uses Ollama when enabled and reachable; otherwise static fallback.
    """
    phase = (phase or "pre").lower()
    if phase not in ("pre", "mid", "end", "suggestion"):
        phase = "pre"

    prompt = _build_user_prompt(phase, context)
    llm_text = _ollama_generate(prompt)
    if llm_text:
        return CoachResult(message=llm_text, source="ollama")

    return CoachResult(message=_fallback_message(phase), source="fallback")
