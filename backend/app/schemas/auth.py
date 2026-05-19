from pydantic import BaseModel, Field, field_validator
import re


def _validate_email(v: str) -> str:
    """Basic email validation that allows .local and other non-standard TLDs."""
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v):
        raise ValueError('Invalid email address')
    return v.lower().strip()


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    password: str = Field(min_length=6, max_length=128)

    @field_validator('email')
    @classmethod
    def email_valid(cls, v: str) -> str:
        return _validate_email(v)


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def email_valid(cls, v: str) -> str:
        return _validate_email(v)


class ForgotPassword(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def email_valid(cls, v: str) -> str:
        return _validate_email(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True
