from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.clients.supabase import SupabaseResourceNotFoundError
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
TRIP_ID = UUID("0fdce689-20d9-41ad-ac41-f5640c5ff8c2")
TRIP_PLACE_ID = UUID("12d6b67a-21da-40d4-9643-bfd6df8b42a2")
PLACE_ID = UUID("687a1450-2c54-43c8-9e47-9c9b82acf311")

TRIP = {
    "id": str(TRIP_ID),
    "owner_id": str(USER_ID),
    "name": "Manila Weekend",
    "destination_name": "Manila",
    "destination_latitude": 14.5995,
    "destination_longitude": 120.9842,
    "start_date": None,
    "end_date": None,
    "budget": None,
    "status": "planning",
    "member_count": 1,
    "current_user_role": "owner",
    "created_at": "2026-08-19T00:00:00Z",
    "updated_at": "2026-08-19T00:00:00Z",
}

SAVED_PLACE = {
    "id": str(TRIP_PLACE_ID),
    "trip_id": str(TRIP_ID),
    "place_id": str(PLACE_ID),
    "google_place_id": "google-place-123",
    "name": "National Museum",
    "address": "Manila",
    "location": {"latitude": 14.5869, "longitude": 120.9816},
    "primary_type": "museum",
    "rating": None,
    "suggested_by": str(USER_ID),
    "scheduled_date": "2026-08-22",
    "scheduled_time": "09:00:00",
    "duration_minutes": 120,
    "voting_enabled": True,
    "leader_finalized_at": None,
    "leader_finalized_by": None,
    "vote_count": 0,
    "required_vote_count": 1,
    "current_user_voted": False,
    "is_confirmed": False,
    "google_data_refreshed_at": "2026-08-19T00:00:00Z",
    "created_at": "2026-08-19T00:00:00Z",
}


class FakeSupabaseClient:
    def __init__(self, *, role: str = "owner") -> None:
        self.place: dict[str, object] = SAVED_PLACE.copy()
        self.places: list[Mapping[str, object]] = [self.place]
        self.saved_values: Mapping[str, object] | None = None
        self.role = role

    async def get_trip(self, trip_id: UUID, user_id: UUID) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        return {**TRIP, "current_user_role": self.role}

    async def list_trip_places(
        self,
        trip_id: UUID,
        user_id: UUID,
    ) -> list[Mapping[str, object]]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        return self.places

    async def get_trip_place(
        self,
        trip_id: UUID,
        trip_place_id: UUID,
        user_id: UUID,
    ) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        if trip_place_id != TRIP_PLACE_ID:
            raise SupabaseResourceNotFoundError("Saved place was not found")
        return self.place

    async def save_trip_place(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        self.saved_values = values
        return self.place

    async def delete_trip_place(self, trip_id: UUID, trip_place_id: UUID) -> None:
        assert trip_id == TRIP_ID
        if trip_place_id != TRIP_PLACE_ID:
            raise SupabaseResourceNotFoundError("Saved place was not found")
        self.places = []

    async def add_trip_place_vote(self, trip_place_id: UUID, user_id: UUID) -> None:
        assert trip_place_id == TRIP_PLACE_ID
        assert user_id == USER_ID
        self.place["vote_count"] = 1
        self.place["current_user_voted"] = True

    async def remove_trip_place_vote(self, trip_place_id: UUID, user_id: UUID) -> None:
        assert trip_place_id == TRIP_PLACE_ID
        assert user_id == USER_ID
        self.place["vote_count"] = 0
        self.place["current_user_voted"] = False


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_trip_places_require_access_token() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.get(f"/api/v1/trips/{TRIP_ID}/places")

    assert response.status_code == 401


def test_save_and_list_trip_places() -> None:
    fake_supabase = FakeSupabaseClient()
    payload = {
        "google_place_id": "google-place-123",
        "name": "National Museum",
        "address": "Manila",
        "location": {"latitude": 14.5869, "longitude": 120.9816},
        "primary_type": "museum",
        "rating": None,
        "scheduled_date": "2026-08-22",
        "scheduled_time": "09:00:00",
        "duration_minutes": 120,
        "voting_enabled": True,
    }

    with authenticated_client(fake_supabase) as client:
        save_response = client.post(f"/api/v1/trips/{TRIP_ID}/places", json=payload)
        list_response = client.get(f"/api/v1/trips/{TRIP_ID}/places")

    app.dependency_overrides.clear()
    assert save_response.status_code == 201
    assert save_response.json()["google_place_id"] == "google-place-123"
    assert fake_supabase.saved_values == payload
    assert list_response.status_code == 200
    assert list_response.json()[0]["vote_count"] == 0


def test_add_and_remove_vote() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        vote_response = client.put(f"/api/v1/trips/{TRIP_ID}/places/{TRIP_PLACE_ID}/vote")
        unvote_response = client.delete(f"/api/v1/trips/{TRIP_ID}/places/{TRIP_PLACE_ID}/vote")

    app.dependency_overrides.clear()
    assert vote_response.status_code == 200
    assert vote_response.json()["vote_count"] == 1
    assert vote_response.json()["current_user_voted"] is True
    assert unvote_response.status_code == 200
    assert unvote_response.json()["vote_count"] == 0
    assert unvote_response.json()["current_user_voted"] is False


def test_member_cannot_disable_group_voting() -> None:
    fake_supabase = FakeSupabaseClient(role="member")
    payload = {
        "google_place_id": "google-place-123",
        "name": "National Museum",
        "location": {"latitude": 14.5869, "longitude": 120.9816},
        "scheduled_date": "2026-08-22",
        "scheduled_time": "09:00:00",
        "voting_enabled": False,
    }

    with authenticated_client(fake_supabase) as client:
        response = client.post(f"/api/v1/trips/{TRIP_ID}/places", json=payload)

    app.dependency_overrides.clear()
    assert response.status_code == 403
    assert response.json()["detail"] == ("Only trip owners and admins can disable group voting")
    assert fake_supabase.saved_values is None


def test_vote_is_rejected_when_leader_disabled_voting() -> None:
    fake_supabase = FakeSupabaseClient()
    fake_supabase.place["voting_enabled"] = False

    with authenticated_client(fake_supabase) as client:
        response = client.put(f"/api/v1/trips/{TRIP_ID}/places/{TRIP_PLACE_ID}/vote")

    app.dependency_overrides.clear()
    assert response.status_code == 409
    assert response.json()["detail"] == "Group voting is disabled for this place"


def test_delete_saved_place() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.delete(f"/api/v1/trips/{TRIP_ID}/places/{TRIP_PLACE_ID}")

    app.dependency_overrides.clear()
    assert response.status_code == 204
    assert fake_supabase.places == []


def test_invalid_coordinates_are_rejected() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.post(
            f"/api/v1/trips/{TRIP_ID}/places",
            json={
                "google_place_id": "google-place-123",
                "name": "Invalid Place",
                "location": {"latitude": 100, "longitude": 120},
            },
        )

    app.dependency_overrides.clear()
    assert response.status_code == 422
    assert fake_supabase.saved_values is None
