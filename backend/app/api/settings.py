from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.coach import CoachChatRequest, CoachChatResponse, CoachClientContext
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.coach import coach_chat, coach_message, ollama_available, personalized_greeting
from app.services.coach_context import build_coach_context

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _coach_context(
    user: User,
    db: Session,
    client: CoachClientContext | None = None,
    **query_overrides,
) -> dict:
    overrides = {k: v for k, v in query_overrides.items() if v is not None}
    if client:
        overrides.update(client.model_dump(exclude_none=True))
    return build_coach_context(user, db, **overrides)


@router.get("", response_model=SettingsResponse)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    return s


@router.put("", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


@router.get("/coach/status")
def get_coach_status(user: User = Depends(get_current_user)):
    """Check whether Ollama is reachable and the configured model is pulled."""
    from app.core.config import settings as app_settings

    return {
        "ollama_enabled": app_settings.ollama_enabled,
        "ollama_model": app_settings.ollama_model,
        "ollama_base_url": app_settings.ollama_base_url,
        "ollama_ready": ollama_available(),
    }


@router.get("/coach/greeting")
def get_coach_greeting(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: str | None = Query(None),
    planned_minutes: int | None = Query(None, ge=1, le=480),
    session_title: str | None = Query(None, max_length=255),
    task_title: str | None = Query(None, max_length=255),
    goal: str | None = Query(None, max_length=500),
    in_focus_session: bool | None = Query(None),
):
    """Instant personalized greeting from DB (no Ollama wait)."""
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s.ai_coach_enabled:
        return {"message": "AI coach is disabled in settings.", "source": "disabled"}

    ctx = _coach_context(
        user,
        db,
        page=page,
        planned_minutes=planned_minutes,
        session_title=session_title,
        task_title=task_title,
        goal=goal,
        in_focus_session=in_focus_session,
    )
    return {"message": personalized_greeting(ctx), "source": "system"}


@router.post("/coach/chat", response_model=CoachChatResponse)
def post_coach_chat(
    body: CoachChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s.ai_coach_enabled:
        return CoachChatResponse(
            message="AI coach is disabled. Turn it on in Settings to chat.",
            source="disabled",
        )

    history = [{"role": m.role, "content": m.content} for m in body.messages]
    result = coach_chat(history, _coach_context(user, db, client=body.client))
    return CoachChatResponse(message=result.message, source=result.source)


@router.get("/coach/{phase}")
def get_coach_message(
    phase: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: str | None = Query(None),
    planned_minutes: int | None = Query(None, ge=1, le=480),
    session_title: str | None = Query(None, max_length=255),
    task_title: str | None = Query(None, max_length=255),
    goal: str | None = Query(None, max_length=500),
    in_focus_session: bool | None = Query(None),
):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s.ai_coach_enabled:
        return {
            "message": "AI coach is disabled in settings.",
            "source": "disabled",
        }

    ctx = _coach_context(
        user,
        db,
        page=page,
        planned_minutes=planned_minutes,
        session_title=session_title,
        task_title=task_title,
        goal=goal,
        in_focus_session=in_focus_session,
    )
    result = coach_message(phase, ctx)
    return {"message": result.message, "source": result.source}
