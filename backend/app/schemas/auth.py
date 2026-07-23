import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.config import settings


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "developer"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in settings.allowed_roles:
            raise ValueError(f"Role must be one of: {', '.join(settings.allowed_roles)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
