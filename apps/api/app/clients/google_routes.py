from collections.abc import Sequence

import httpx

from app.schemas.google_maps import RouteQuery

COMPUTE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

DEFAULT_ROUTE_FIELDS: tuple[str, ...] = (
    "routes.distanceMeters",
    "routes.duration",
    "routes.polyline.encodedPolyline",
    "routes.legs.distanceMeters",
    "routes.legs.duration",
)


class GoogleRoutesClient:
    def __init__(
        self,
        api_key: str,
        http_client: httpx.AsyncClient,
        field_mask: Sequence[str] = DEFAULT_ROUTE_FIELDS,
    ) -> None:
        if not api_key:
            raise ValueError("Google Maps API key is required")
        if not field_mask:
            raise ValueError("At least one Google Routes response field is required")

        self._api_key = api_key
        self._http_client = http_client
        self._field_mask = tuple(field_mask)

    async def compute_route(self, query: RouteQuery) -> dict:
        response = await self._http_client.post(
            COMPUTE_ROUTES_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self._api_key,
                "X-Goog-FieldMask": ",".join(self._field_mask),
            },
            json={
                "origin": {"location": {"latLng": query.origin.model_dump()}},
                "destination": {"location": {"latLng": query.destination.model_dump()}},
                "travelMode": query.travel_mode,
                "computeAlternativeRoutes": False,
                "languageCode": "en-US",
                "units": "METRIC",
            },
        )
        response.raise_for_status()
        return response.json()
