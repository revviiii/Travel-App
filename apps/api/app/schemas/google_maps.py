from typing import Literal

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class NearbySearchQuery(BaseModel):
    center: Coordinates
    radius_meters: float = Field(gt=0, le=50_000)
    included_types: list[str] = Field(min_length=1, max_length=50)
    max_result_count: int = Field(default=10, ge=1, le=20)
    rank_preference: Literal["POPULARITY", "DISTANCE"] = "POPULARITY"


class RouteQuery(BaseModel):
    origin: Coordinates
    destination: Coordinates
    travel_mode: Literal["DRIVE", "WALK", "BICYCLE", "TRANSIT", "TWO_WHEELER"] = "DRIVE"
