from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TrackPoint(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    recorded_at: datetime


class TravelTrackCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=80)
    started_at: datetime
    ended_at: datetime
    duration_seconds: int = Field(ge=0, le=604_800)
    distance_meters: float = Field(ge=0, le=10_000_000)
    path: list[TrackPoint] = Field(min_length=2, max_length=20_000)

    @model_validator(mode="after")
    def validate_time_range(self) -> "TravelTrackCreate":
        if self.ended_at < self.started_at:
            raise ValueError("ended_at must be after started_at")
        return self


class TravelTrackResponse(TravelTrackCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
