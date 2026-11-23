import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Achievement, Character, GameSave, User
from ..schemas import SaveIn, SaveOut
from ..security import get_current_user

router = APIRouter(prefix="/saves", tags=["salvataggi"])
MAX_PAYLOAD = 2_000_000  # 2 MB


@router.get("/current", response_model=SaveOut)
async def current_save(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GameSave).where(GameSave.user_id == user.id))
    save = result.scalar_one_or_none()
    if not save:
        return SaveOut(payload=None)
    return SaveOut(payload=save.payload, version=save.version, saved_at=save.saved_at)


@router.put("/current", response_model=SaveOut)
async def upsert_save(body: SaveIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if len(json.dumps(body.payload, ensure_ascii=False)) > MAX_PAYLOAD:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Salvataggio troppo grande")

    now = datetime.now(timezone.utc)
    result = await db.execute(select(GameSave).where(GameSave.user_id == user.id))
    save = result.scalar_one_or_none()
    if save:
        save.payload = body.payload
        save.version += 1
        save.saved_at = now
    else:
        save = GameSave(id=uuid.uuid4(), user_id=user.id, payload=body.payload, version=1, saved_at=now)
        db.add(save)

    # Sincronizza il personaggio "principale" con il profilo del salvataggio.
    profile = body.payload.get("profile") or {}
    ch_result = await db.execute(select(Character).where(Character.user_id == user.id))
    character = ch_result.scalar_one_or_none()
    if character:
        if profile.get("name"):
            character.name = str(profile["name"])[:40]
        if profile.get("surname"):
            character.surname = str(profile["surname"])[:40]
        if isinstance(profile.get("look"), dict):
            character.look = profile["look"]
        if profile.get("perk"):
            character.perk = str(profile["perk"])[:30]
        character.level = int(body.payload.get("level") or 1)
    else:
        db.add(Character(
            id=uuid.uuid4(), user_id=user.id,
            name=str(profile.get("name") or user.name)[:40],
            surname=str(profile.get("surname") or "Esposito")[:40],
            look=profile.get("look") or {}, perk=str(profile.get("perk") or "nativo")[:30],
            level=int(body.payload.get("level") or 1),
        ))

    # Obiettivi sbloccati: inserimento idempotente.
    for code in (body.payload.get("achievements") or []):
        exists = await db.execute(
            select(Achievement).where(Achievement.user_id == user.id, Achievement.code == str(code)[:60])
        )
        if exists.scalar_one_or_none() is None:
            db.add(Achievement(user_id=user.id, code=str(code)[:60]))

    await db.commit()
    return SaveOut(payload=save.payload, version=save.version, saved_at=save.saved_at)
