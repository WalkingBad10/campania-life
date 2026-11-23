from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import auth, saves, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(saves.router, prefix="/api")
app.include_router(profile.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name, "version": "1.0.0"}


# In produzione il client buildato viene servito dallo stesso processo.
dist = Path(__file__).resolve().parent.parent.parent / "client" / "dist"
if dist.is_dir():
    app.mount("/", StaticFiles(directory=str(dist), html=True), name="client")
