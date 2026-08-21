from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPOSITORY_ROOT / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "Travel App API"
    api_v1_prefix: str = "/api/v1"

    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: SecretStr | None = None

    google_maps_api_key: SecretStr | None = None
    google_places_requests_per_minute: int = Field(default=12, ge=1, le=1_000)
    google_routes_requests_per_minute: int = Field(default=20, ge=1, le=1_000)
    cors_origins: str = "http://localhost:8081"


@lru_cache
def get_settings() -> Settings:
    return Settings()
