import re
from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field


def normalize_preference_keys(values: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for value in values:
        key = value.strip().lower()
        if key and re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,49}", key) is None:
            raise ValueError(f"Invalid preference key: {value}")
        if key and key not in seen:
            normalized.append(key)
            seen.add(key)

    return normalized


PreferenceKeys = Annotated[list[str], AfterValidator(normalize_preference_keys)]


class CurrentUser(BaseModel):
    id: UUID
    email: str | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    full_name: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    phone_number: str | None = None
    gender: str | None = None
    preferred_language: str
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=2048)
    country: str | None = Field(default=None, max_length=100)
    phone_number: str | None = Field(default=None, max_length=32)
    gender: str | None = Field(default=None, max_length=50)
    preferred_language: str | None = Field(default=None, min_length=2, max_length=20)
    onboarding_completed: bool | None = None


class PreferencesResponse(BaseModel):
    preference_keys: list[str]


class PreferencesUpdate(BaseModel):
    preference_keys: PreferenceKeys = Field(max_length=50)
