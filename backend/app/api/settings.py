from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.coach import coach_message

router = APIRouter(prefix="/api/settings", tags=["settings"])


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


@router.get("/coach/{phase}")
def get_coach_message(phase: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not s.ai_coach_enabled:
        return {"message": "AI coach is disabled in settings."}
    return {"message": coach_message(phase)}
