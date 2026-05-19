from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.achievement import Achievement
from app.models.user import User

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("")
def list_achievements(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Achievement)
        .filter(Achievement.user_id == user.id)
        .order_by(Achievement.earned_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "badge_name": a.badge_name,
            "description": a.description,
            "earned_at": a.earned_at.isoformat(),
        }
        for a in rows
    ]
