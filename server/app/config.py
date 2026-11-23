from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Campania Life API"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/campania_life"
    secret_key: str = "sviluppo-solo-cambia-questa-chiave"
    access_token_expire_minutes: int = 10080
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    debug: bool = False

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
