from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.trip_place import TripPlaceResponse


class BuiltItineraryItem(BaseModel):
    trip_place_id: str
    day_number: int = Field(ge=1, le=365)
    position: int = Field(ge=1, le=100)
    start_time: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    duration_minutes: int = Field(ge=15, le=720)
    travel_time_from_previous_minutes: int = Field(ge=0, le=1440)
    notes: str = Field(max_length=500)


class BuiltItinerary(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1, max_length=1000)
    items: list[BuiltItineraryItem] = Field(min_length=1, max_length=20)


class ItineraryItemResponse(BaseModel):
    id: UUID
    trip_place_id: UUID
    day_number: int = Field(ge=1, le=365)
    position: int = Field(ge=1)
    start_time: time
    duration_minutes: int = Field(ge=15)
    travel_time_from_previous_minutes: int = Field(ge=0)
    notes: str
    place: TripPlaceResponse
    created_at: datetime


class ItineraryResponse(BaseModel):
    id: UUID
    trip_id: UUID
    created_by: UUID
    title: str
    summary: str
    generation_method: str
    start_date: date
    end_date: date
    items: list[ItineraryItemResponse]
    created_at: datetime
    updated_at: datetime
