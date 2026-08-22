from decimal import ROUND_CEILING, Decimal, InvalidOperation
from typing import Any

from app.schemas.google_maps import (
    ComputedRouteResponse,
    Coordinates,
    NearbyPlacesResponse,
    PlaceMarker,
    PreferenceKey,
    RouteLeg,
    TextPlaceSearchResponse,
)

PREFERENCE_PLACE_TYPES: dict[PreferenceKey, tuple[str, ...]] = {
    "outdoors": ("park", "tourist_attraction"),
    "city": ("tourist_attraction", "museum"),
    "culture": ("museum", "art_gallery", "historical_place"),
    "beaches": ("beach",),
    "nature": ("park", "botanical_garden"),
    "roadtrips": ("tourist_attraction",),
    "food": ("restaurant", "cafe"),
    "gym": ("gym",),
    "bar": ("bar",),
    "shopping": ("shopping_mall", "market"),
    "skiing": ("ski_resort",),
    "retreats": ("spa",),
    "spa": ("spa",),
}


def place_types_for_preferences(preference_keys: list[PreferenceKey]) -> list[str]:
    place_types: list[str] = []
    seen: set[str] = set()

    for preference_key in preference_keys:
        for place_type in PREFERENCE_PLACE_TYPES[preference_key]:
            if place_type not in seen:
                place_types.append(place_type)
                seen.add(place_type)

    return place_types


def normalize_places(
    payload: dict[str, Any],
    center: Coordinates,
    radius_meters: float,
) -> NearbyPlacesResponse:
    markers: list[PlaceMarker] = []

    for place in payload.get("places", []):
        location = place.get("location")
        place_id = place.get("id")
        if not isinstance(location, dict) or not isinstance(place_id, str):
            continue

        display_name = place.get("displayName", {})
        name = display_name.get("text") if isinstance(display_name, dict) else None

        photos = place.get("photos")
        first_photo = photos[0] if isinstance(photos, list) and photos else None
        photo_name = first_photo.get("name") if isinstance(first_photo, dict) else None

        markers.append(
            PlaceMarker(
                place_id=place_id,
                name=name or "Unnamed place",
                address=place.get("formattedAddress"),
                location=Coordinates.model_validate(location),
                primary_type=place.get("primaryType"),
                rating=place.get("rating"),
                photo_name=photo_name if isinstance(photo_name, str) else None,
            )
        )

    return NearbyPlacesResponse(
        center=center,
        radius_meters=radius_meters,
        places=markers,
    )


def normalize_text_places(payload: dict[str, Any]) -> TextPlaceSearchResponse:
    normalized = normalize_places(payload, Coordinates(latitude=0, longitude=0), 0)
    return TextPlaceSearchResponse(places=normalized.places)


def google_duration_seconds(value: object) -> int:
    if not isinstance(value, str) or not value.endswith("s"):
        raise ValueError("Google returned an invalid route duration")

    try:
        seconds = Decimal(value[:-1])
    except InvalidOperation as exc:
        raise ValueError("Google returned an invalid route duration") from exc

    return int(seconds.to_integral_value(rounding=ROUND_CEILING))


def normalize_route(payload: dict[str, Any]) -> ComputedRouteResponse:
    routes = payload.get("routes", [])
    if not routes:
        raise ValueError("Google returned no route for these locations")

    route = routes[0]
    polyline = route.get("polyline", {}).get("encodedPolyline")
    if not isinstance(polyline, str) or not polyline:
        raise ValueError("Google returned a route without a polyline")

    legs = [
        RouteLeg(
            distance_meters=int(leg.get("distanceMeters", 0)),
            duration_seconds=google_duration_seconds(leg.get("duration", "0s")),
        )
        for leg in route.get("legs", [])
    ]

    return ComputedRouteResponse(
        distance_meters=int(route.get("distanceMeters", 0)),
        duration_seconds=google_duration_seconds(route.get("duration")),
        encoded_polyline=polyline,
        legs=legs,
    )
