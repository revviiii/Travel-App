import asyncio
import json

import httpx

from app.clients.google_places import (
    PLACES_NEARBY_URL,
    PLACES_TEXT_SEARCH_URL,
    GooglePlacesClient,
)
from app.clients.google_routes import COMPUTE_ROUTES_URL, GoogleRoutesClient
from app.schemas.google_maps import (
    Coordinates,
    NearbySearchQuery,
    RouteQuery,
    TextPlaceSearchRequest,
)


def test_places_client_sends_required_headers_and_body() -> None:
    async def scenario() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert str(request.url) == PLACES_NEARBY_URL
            assert request.headers["X-Goog-Api-Key"] == "test-key"
            assert request.headers["X-Goog-FieldMask"]
            assert "places.rating" not in request.headers["X-Goog-FieldMask"]
            assert "places.priceLevel" not in request.headers["X-Goog-FieldMask"]
            assert json.loads(request.content)["includedTypes"] == [
                "tourist_attraction",
                "museum",
            ]
            return httpx.Response(200, json={"places": []})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            client = GooglePlacesClient("test-key", http_client)
            result = await client.search_nearby(
                NearbySearchQuery(
                    center=Coordinates(latitude=14.5995, longitude=120.9842),
                    radius_meters=2_000,
                    included_types=["tourist_attraction", "museum"],
                )
            )

        assert result == {"places": []}

    asyncio.run(scenario())


def test_places_client_searches_destination_text() -> None:
    async def scenario() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert str(request.url) == PLACES_TEXT_SEARCH_URL
            assert request.headers["X-Goog-Api-Key"] == "test-key"
            assert json.loads(request.content) == {
                "textQuery": "Tokyo, Japan",
                "pageSize": 3,
            }
            return httpx.Response(200, json={"places": []})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            client = GooglePlacesClient("test-key", http_client)
            result = await client.search_text(
                TextPlaceSearchRequest(query="Tokyo, Japan", max_result_count=3)
            )

        assert result == {"places": []}

    asyncio.run(scenario())


def test_routes_client_sends_required_headers_and_body() -> None:
    async def scenario() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert str(request.url) == COMPUTE_ROUTES_URL
            assert request.headers["X-Goog-Api-Key"] == "test-key"
            assert request.headers["X-Goog-FieldMask"]
            return httpx.Response(
                200,
                json={"routes": [{"distanceMeters": 1500, "duration": "600s"}]},
            )

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            client = GoogleRoutesClient("test-key", http_client)
            result = await client.compute_route(
                RouteQuery(
                    origin=Coordinates(latitude=14.5995, longitude=120.9842),
                    destination=Coordinates(latitude=14.5896, longitude=120.9816),
                    travel_mode="WALK",
                )
            )

        assert result["routes"][0]["distanceMeters"] == 1500

    asyncio.run(scenario())
