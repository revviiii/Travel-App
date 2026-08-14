from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
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
    openai_api_key: SecretStr | None = None
    cors_origins: str = "http://localhost:8081"


@lru_cache
def get_settings() -> Settings:
    return Settings()
