from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import LeaderOut
from ..security import get_current_user

router = APIRouter(tags=["profilo"])


@router.get("/profile/me")
async def my_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("""
        SELECT c.name, c.surname, c.look, c.perk, c.level,
               COALESCE((s.payload->>'money')::numeric, 0) AS money,
               COALESCE((s.payload->'stats'->>'caught')::int, 0) AS caught
        FROM characters c
        LEFT JOIN game_saves s ON s.user_id = c.user_id
        WHERE c.user_id = :uid
    """), {"uid": str(user.id)})).mappings().first()
    if not row:
        return {"name": user.name, "surname": "", "level": 1, "money": 0, "caught": 0}
    return dict(row)


@router.get("/leaderboard", response_model=list[LeaderOut])
async def leaderboard(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text("""
        SELECT name, level, money, bank, creatures_caught
        FROM v_leaderboard
        ORDER BY level DESC, (money + bank) DESC, creatures_caught DESC
        LIMIT 50
    """))).mappings().all()
    return [LeaderOut(**dict(r)) for r in rows]
