from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import (
    get_current_user,
    get_google_places_client,
    get_google_routes_client,
    get_maps_rate_limiter,
)
from app.main import app
from app.schemas.google_maps import NearbySearchQuery, RouteQuery, TextPlaceSearchRequest
from app.schemas.profile import CurrentUser
from app.services.rate_limit import RateLimitExceededError

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")


class FakePlacesClient:
    query: NearbySearchQuery | None = None
    text_query: TextPlaceSearchRequest | None = None

    async def search_nearby(self, query: NearbySearchQuery) -> dict:
        self.query = query
        return {
            "places": [
                {
                    "id": "ChIJ-test-place",
                    "displayName": {"text": "National Museum"},
                    "formattedAddress": "Manila, Metro Manila",
                    "location": {"latitude": 14.5869, "longitude": 120.9816},
                    "primaryType": "museum",
                    "photos": [{"name": "places/ChIJ-test-place/photos/photo-1"}],
                }
            ]
        }

    async def search_text(self, query: TextPlaceSearchRequest) -> dict:
        self.text_query = query
        return {
            "places": [
                {
                    "id": "ChIJ-tokyo",
                    "displayName": {"text": "Tokyo"},
                    "formattedAddress": "Tokyo, Japan",
                    "location": {"latitude": 35.6764, "longitude": 139.65},
                    "primaryType": "locality",
                    "photos": [{"name": "places/ChIJ-tokyo/photos/photo-1"}],
                }
            ]
        }


class FakeRoutesClient:
    query: RouteQuery | None = None

    async def compute_route(self, query: RouteQuery) -> dict:
        self.query = query
        return {
            "routes": [
                {
                    "distanceMeters": 1500,
                    "duration": "600.2s",
                    "polyline": {"encodedPolyline": "encoded-route"},
                    "legs": [{"distanceMeters": 1500, "duration": "600.2s"}],
                }
            ]
        }


class RejectingRateLimiter:
    async def check(self, *args: object, **kwargs: object) -> None:
        raise RateLimitExceededError(17)


def override_authenticated_user() -> CurrentUser:
    return CurrentUser(id=USER_ID, email="ramyl@example.com")


def test_maps_endpoint_requires_authentication() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/maps/places/nearby",
            json={"center": {"latitude": 14.5995, "longitude": 120.9842}},
        )

    assert response.status_code == 401


def test_nearby_places_maps_preferences_and_normalizes_markers() -> None:
    fake_places = FakePlacesClient()
    app.dependency_overrides[get_current_user] = override_authenticated_user
    app.dependency_overrides[get_google_places_client] = lambda: fake_places

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/maps/places/nearby",
            json={
                "center": {"latitude": 14.5995, "longitude": 120.9842},
                "radius_meters": 20000,
                "preference_keys": ["culture", "food"],
                "max_result_count": 20,
            },
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["places"][0] == {
        "place_id": "ChIJ-test-place",
        "name": "National Museum",
        "address": "Manila, Metro Manila",
        "location": {"latitude": 14.5869, "longitude": 120.9816},
        "primary_type": "museum",
        "rating": None,
        "photo_name": "places/ChIJ-test-place/photos/photo-1",
    }
    assert fake_places.query is not None
    assert fake_places.query.radius_meters == 20000
    assert fake_places.query.max_result_count == 20
    assert fake_places.query.included_types == [
        "museum",
        "art_gallery",
        "historical_place",
        "restaurant",
        "cafe",
    ]


def test_text_search_resolves_a_remote_destination() -> None:
    fake_places = FakePlacesClient()
    app.dependency_overrides[get_current_user] = override_authenticated_user
    app.dependency_overrides[get_google_places_client] = lambda: fake_places

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/maps/places/search",
            json={"query": "Tokyo, Japan", "max_result_count": 1},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["places"][0]["location"] == {
        "latitude": 35.6764,
        "longitude": 139.65,
    }
    assert response.json()["places"][0]["photo_name"] == ("places/ChIJ-tokyo/photos/photo-1")
    assert fake_places.text_query is not None
    assert fake_places.text_query.query == "Tokyo, Japan"


def test_compute_route_normalizes_polyline_distance_and_duration() -> None:
    fake_routes = FakeRoutesClient()
    app.dependency_overrides[get_current_user] = override_authenticated_user
    app.dependency_overrides[get_google_routes_client] = lambda: fake_routes

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/maps/routes/compute",
            json={
                "origin": {"latitude": 14.5995, "longitude": 120.9842},
                "destination": {"latitude": 14.5869, "longitude": 120.9816},
                "travel_mode": "WALK",
            },
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == {
        "distance_meters": 1500,
        "duration_seconds": 601,
        "encoded_polyline": "encoded-route",
        "legs": [{"distance_meters": 1500, "duration_seconds": 601}],
        "provider": "google",
    }
    assert fake_routes.query is not None
    assert fake_routes.query.travel_mode == "WALK"


def test_maps_endpoint_throttles_before_spending_provider_quota() -> None:
    app.dependency_overrides[get_current_user] = override_authenticated_user
    app.dependency_overrides[get_google_places_client] = FakePlacesClient
    app.dependency_overrides[get_maps_rate_limiter] = RejectingRateLimiter

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/maps/places/nearby",
            json={"center": {"latitude": 14.5995, "longitude": 120.9842}},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 429
    assert response.headers["retry-after"] == "17"
    assert response.json() == {"detail": "Too many map requests. Please wait before trying again."}
