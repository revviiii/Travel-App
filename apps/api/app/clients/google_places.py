from collections.abc import Sequence

import httpx

from app.schemas.google_maps import NearbySearchQuery

PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Do not replace this with "*" in production. Every additional requested field
# increases payload size and can move a request into a more expensive SKU.
DEFAULT_PLACE_FIELDS: tuple[str, ...] = (
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryType",
)


class GooglePlacesClient:
    def __init__(
        self,
        api_key: str,
        http_client: httpx.AsyncClient,
        field_mask: Sequence[str] = DEFAULT_PLACE_FIELDS,
    ) -> None:
        if not api_key:
            raise ValueError("Google Maps API key is required")
        if not field_mask:
            raise ValueError("At least one Google Places response field is required")

        self._api_key = api_key
        self._http_client = http_client
        self._field_mask = tuple(field_mask)

    async def search_nearby(self, query: NearbySearchQuery) -> dict:
        request_body = {
            "maxResultCount": query.max_result_count,
            "rankPreference": query.rank_preference,
            "locationRestriction": {
                "circle": {
                    "center": query.center.model_dump(),
                    "radius": query.radius_meters,
                }
            },
        }
        if query.included_types:
            request_body["includedTypes"] = query.included_types

        response = await self._http_client.post(
            PLACES_NEARBY_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self._api_key,
                "X-Goog-FieldMask": ",".join(self._field_mask),
            },
            json=request_body,
        )
        response.raise_for_status()
        return response.json()
