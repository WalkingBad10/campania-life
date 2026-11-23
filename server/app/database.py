from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from .config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Applica lo schema SQL canonico (idempotente)."""
    sql_path = Path(__file__).resolve().parent.parent / "sql" / "001_init.sql"
    script = sql_path.read_text(encoding="utf-8")
    async with engine.begin() as conn:
        for statement in script.split(";"):
            body = statement.strip()
            # Rimuove le righe di commento per non confondere il rilevamento di statement vuoti.
            body = "\n".join(line for line in body.splitlines() if not line.strip().startswith("--")).strip()
            if body:
                await conn.execute(text(body))
