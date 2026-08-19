from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.clients.supabase import SupabaseResourceNotFoundError
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
TRIP_ID = UUID("0fdce689-20d9-41ad-ac41-f5640c5ff8c2")
TRIP = {
    "id": str(TRIP_ID),
    "owner_id": str(USER_ID),
    "name": "Manila Weekend",
    "destination_name": "Manila",
    "destination_latitude": 14.5995,
    "destination_longitude": 120.9842,
    "start_date": None,
    "end_date": None,
    "budget": "5000.00",
    "status": "planning",
    "member_count": 1,
    "current_user_role": "owner",
    "created_at": "2026-08-19T00:00:00Z",
    "updated_at": "2026-08-19T00:00:00Z",
}


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.trips: list[Mapping[str, object]] = [TRIP.copy()]
        self.create_values: Mapping[str, object] | None = None

    async def create_trip(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert user_id == USER_ID
        self.create_values = values
        return TRIP

    async def list_trips(self, user_id: UUID) -> list[Mapping[str, object]]:
        assert user_id == USER_ID
        return self.trips

    async def get_trip(
        self,
        trip_id: UUID,
        user_id: UUID,
    ) -> Mapping[str, object]:
        assert user_id == USER_ID
        if trip_id != TRIP_ID:
            raise SupabaseResourceNotFoundError("Trip was not found")
        return TRIP

    async def list_trip_members(self, trip_id: UUID) -> list[Mapping[str, object]]:
        assert trip_id == TRIP_ID
        return [
            {
                "user_id": str(USER_ID),
                "role": "owner",
                "joined_at": "2026-08-19T00:00:00Z",
            }
        ]

    async def delete_trip(self, trip_id: UUID) -> None:
        if trip_id != TRIP_ID:
            raise SupabaseResourceNotFoundError("Trip was not found")
        self.trips = []


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_trips_require_access_token() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.get("/api/v1/trips")

    assert response.status_code == 401


def test_create_and_list_trips() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        create_response = client.post(
            "/api/v1/trips",
            json={"name": " Manila Weekend ", "destination_name": "Manila"},
        )
        list_response = client.get("/api/v1/trips")

    app.dependency_overrides.clear()
    assert create_response.status_code == 201
    assert create_response.json()["member_count"] == 1
    assert create_response.json()["current_user_role"] == "owner"
    assert fake_supabase.create_values == {
        "name": "Manila Weekend",
        "destination_name": "Manila",
        "destination_latitude": None,
        "destination_longitude": None,
        "start_date": None,
        "end_date": None,
        "budget": None,
    }
    assert list_response.status_code == 200
    assert list_response.json()[0]["name"] == "Manila Weekend"


def test_read_members_and_delete_trip() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        read_response = client.get(f"/api/v1/trips/{TRIP_ID}")
        members_response = client.get(f"/api/v1/trips/{TRIP_ID}/members")
        delete_response = client.delete(f"/api/v1/trips/{TRIP_ID}")

    app.dependency_overrides.clear()
    assert read_response.status_code == 200
    assert members_response.status_code == 200
    assert members_response.json()[0]["role"] == "owner"
    assert delete_response.status_code == 204
    assert fake_supabase.trips == []


def test_unknown_trip_returns_not_found() -> None:
    fake_supabase = FakeSupabaseClient()
    unknown_id = UUID("f232d21e-6bb2-49dc-ac52-03bdaf9cb0c8")

    with authenticated_client(fake_supabase) as client:
        response = client.get(f"/api/v1/trips/{unknown_id}")

    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json() == {"detail": "Trip was not found"}
