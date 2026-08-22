from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.google_maps import Coordinates


class TripPlaceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    google_place_id: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=200)
    address: str | None = Field(default=None, max_length=500)
    location: Coordinates
    primary_type: str | None = Field(default=None, max_length=100)
    rating: float | None = Field(default=None, ge=0, le=5)
    photo_name: str | None = Field(default=None, max_length=500)
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int = Field(default=120, ge=15, le=720)
    voting_enabled: bool = True


class TripPlaceResponse(BaseModel):
    id: UUID
    trip_id: UUID
    place_id: UUID
    google_place_id: str
    name: str
    address: str | None = None
    location: Coordinates
    primary_type: str | None = None
    rating: float | None = None
    photo_name: str | None = None
    suggested_by: UUID
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int = Field(ge=15, le=720)
    voting_enabled: bool
    leader_finalized_at: datetime | None = None
    leader_finalized_by: UUID | None = None
    vote_count: int = Field(ge=0)
    required_vote_count: int = Field(ge=1)
    current_user_voted: bool
    is_confirmed: bool
    google_data_refreshed_at: datetime
    created_at: datetime
