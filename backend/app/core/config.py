from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "NPET API"
    APP_ENV: str = "development"
    PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_EXPIRE_MINUTES: int = 60

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Retorna uma instância única de Settings (cacheada)."""
    return Settings()


settings = get_settings()
