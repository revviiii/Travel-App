from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
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
    "start_date": "2026-08-22",
    "end_date": "2026-08-23",
    "budget": "5000.00",
    "status": "planning",
    "member_count": 2,
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
    "rating": 4.6,
    "suggested_by": str(USER_ID),
    "scheduled_date": "2026-08-22",
    "scheduled_time": "10:30:00",
    "duration_minutes": 120,
    "voting_enabled": True,
    "leader_finalized_at": None,
    "leader_finalized_by": None,
    "vote_count": 2,
    "required_vote_count": 2,
    "current_user_voted": True,
    "is_confirmed": True,
    "google_data_refreshed_at": "2026-08-19T00:00:00Z",
    "created_at": "2026-08-19T00:00:00Z",
}


def itinerary_record() -> dict[str, object]:
    return {
        "id": "4b085df7-0fa8-45b7-ad88-da124b88d470",
        "trip_id": str(TRIP_ID),
        "created_by": str(USER_ID),
        "title": "Manila Weekend itinerary",
        "summary": ("1 scheduled place, ordered by the dates and times chosen by the group."),
        "generation_method": "scheduled-proposals",
        "start_date": "2026-08-22",
        "end_date": "2026-08-22",
        "items": [
            {
                "id": "f86fa005-a8cb-4daf-9906-77a771296072",
                "trip_place_id": str(TRIP_PLACE_ID),
                "day_number": 1,
                "position": 1,
                "start_time": "10:30:00",
                "duration_minutes": 120,
                "travel_time_from_previous_minutes": 0,
                "notes": "2/2 group votes",
                "place": SAVED_PLACE,
                "created_at": "2026-08-19T00:00:00Z",
            }
        ],
        "created_at": "2026-08-19T00:00:00Z",
        "updated_at": "2026-08-19T00:00:00Z",
    }


class FakeSupabaseClient:
    def __init__(
        self,
        *,
        places: list[Mapping[str, object]] | None = None,
        role: str = "owner",
    ) -> None:
        self.places = [SAVED_PLACE] if places is None else places
        self.role = role
        self.itinerary: Mapping[str, object] | None = None
        self.saved_values: Mapping[str, object] | None = None

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

    async def get_trip_itinerary(
        self,
        trip_id: UUID,
        user_id: UUID,
    ) -> Mapping[str, object] | None:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        return self.itinerary

    async def replace_trip_itinerary(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        self.saved_values = values
        self.itinerary = itinerary_record()
        return self.itinerary


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_finalize_itinerary_preserves_the_chosen_schedule() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.post(f"/api/v1/trips/{TRIP_ID}/itinerary/finalize", json={})

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["generation_method"] == "scheduled-proposals"
    assert response.json()["items"][0]["place"]["name"] == "National Museum"
    assert fake_supabase.saved_values is not None
    assert fake_supabase.saved_values["generation_method"] == "scheduled-proposals"
    assert fake_supabase.saved_values["items"] == [
        {
            "trip_place_id": str(TRIP_PLACE_ID),
            "day_number": 1,
            "position": 1,
            "start_time": "10:30",
            "duration_minutes": 120,
            "travel_time_from_previous_minutes": 0,
            "notes": "2/2 group votes",
        }
    ]


def test_get_itinerary_returns_null_before_finalizing() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.get(f"/api/v1/trips/{TRIP_ID}/itinerary")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() is None


def test_finalize_itinerary_requires_saved_place() -> None:
    fake_supabase = FakeSupabaseClient(places=[])

    with authenticated_client(fake_supabase) as client:
        response = client.post(f"/api/v1/trips/{TRIP_ID}/itinerary/finalize", json={})

    app.dependency_overrides.clear()
    assert response.status_code == 400
    assert response.json()["detail"] == ("Save at least one place before finalizing an itinerary")
    assert fake_supabase.saved_values is None


def test_finalize_itinerary_requires_owner_or_admin() -> None:
    fake_supabase = FakeSupabaseClient(role="member")

    with authenticated_client(fake_supabase) as client:
        response = client.post(f"/api/v1/trips/{TRIP_ID}/itinerary/finalize", json={})

    app.dependency_overrides.clear()
    assert response.status_code == 403
    assert response.json()["detail"] == ("Only trip owners and admins can finalize an itinerary")
