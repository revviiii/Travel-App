from typing import Literal

from pydantic import BaseModel, Field

PreferenceKey = Literal[
    "outdoors",
    "city",
    "culture",
    "beaches",
    "nature",
    "roadtrips",
    "food",
    "gym",
    "bar",
    "shopping",
    "skiing",
    "retreats",
    "spa",
]


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class NearbySearchQuery(BaseModel):
    center: Coordinates
    radius_meters: float = Field(gt=0, le=50_000)
    included_types: list[str] = Field(default_factory=list, max_length=50)
    max_result_count: int = Field(default=10, ge=1, le=20)
    rank_preference: Literal["POPULARITY", "DISTANCE"] = "POPULARITY"


class NearbyPlacesRequest(BaseModel):
    center: Coordinates
    radius_meters: float = Field(default=5_000, gt=0, le=20_000)
    preference_keys: list[PreferenceKey] = Field(default_factory=list, max_length=13)
    max_result_count: int = Field(default=10, ge=1, le=10)
    rank_preference: Literal["POPULARITY", "DISTANCE"] = "POPULARITY"


class PlaceMarker(BaseModel):
    place_id: str
    name: str
    address: str | None = None
    location: Coordinates
    primary_type: str | None = None
    rating: float | None = None


class NearbyPlacesResponse(BaseModel):
    center: Coordinates
    radius_meters: float
    places: list[PlaceMarker]
    provider: Literal["google"] = "google"


class RouteQuery(BaseModel):
    origin: Coordinates
    destination: Coordinates
    travel_mode: Literal["DRIVE", "WALK", "BICYCLE", "TRANSIT", "TWO_WHEELER"] = "DRIVE"


class RouteLeg(BaseModel):
    distance_meters: int
    duration_seconds: int


class ComputedRouteResponse(BaseModel):
    distance_meters: int
    duration_seconds: int
    encoded_polyline: str
    legs: list[RouteLeg]
    provider: Literal["google"] = "google"
