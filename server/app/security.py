from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# bcrypt gestisce al massimo 72 byte: tronchiamo in modo esplicito per evitare
# le incompatibilità tra passlib 1.7 e bcrypt 4.x.
def _pw_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_pw_bytes(plain), hashed.encode("ascii"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> str | None:
    try:
        data = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return data.get("sub")
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide o scadute",
        headers={"WWW-Authenticate": "Bearer"},
    )
    subject = decode_token(token)
    if not subject:
        raise credentials_error
    result = await db.execute(select(User).where(User.id == subject))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_error
    return user
