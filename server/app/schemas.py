from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SaveIn(BaseModel):
    payload: dict[str, Any]


class SaveOut(BaseModel):
    payload: Optional[dict[str, Any]] = None
    version: int = 1
    saved_at: Optional[datetime] = None


class LeaderOut(BaseModel):
    name: str
    level: int
    money: float
    bank: float
    creatures_caught: int
