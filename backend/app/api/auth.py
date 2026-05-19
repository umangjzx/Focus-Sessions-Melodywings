import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.settings import UserSettings
from app.models.streak import Streak
from app.models.user import User
from app.schemas.auth import ForgotPassword, TokenResponse, UserLogin, UserRegister, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _init_user(db: Session, user: User) -> None:
    db.add(Streak(user_id=user.id))
    db.add(UserSettings(user_id=user.id))


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    db.flush()
    _init_user(db, user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/logout")
def logout():
    return {"message": "Logged out. Discard client token."}


@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        user.reset_token = secrets.token_urlsafe(32)
        db.commit()
    return {"message": "If that email exists, reset instructions were sent."}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user
