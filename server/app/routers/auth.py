import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import User, Character
from ..schemas import RegisterIn, LoginIn, TokenOut, UserOut
from ..security import hash_password, verify_password, create_access_token, get_current_user
import uuid as _uuid

router = APIRouter(prefix="/auth", tags=["autenticazione"])


def user_out(user: User) -> UserOut:
    return UserOut(id=str(user.id), name=user.name, email=user.email)


def token_for(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(str(user.id)),
        token_type="bearer",
        user=user_out(user),
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(func.lower(User.email) == body.email.lower()))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email già registrata")

    user = User(
        id=uuid.uuid4(),
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()
    db.add(Character(
        id=uuid.uuid4(), user_id=user.id,
        name=body.name.strip()[:40], surname="Esposito",
        look={"hair": "#2d2622", "skin": "#d79c74", "shirt": "#c75b3b", "pants": "#3a4650"},
        perk="nativo", level=1,
    ))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email già registrata")
    return token_for(user)


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(func.lower(User.email) == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o password errati")
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    return token_for(user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user_out(user)
