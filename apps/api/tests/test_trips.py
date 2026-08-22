from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.clients.supabase import (
    SupabaseInvalidInvitationError,
    SupabaseResourceNotFoundError,
)
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
TRIP_ID = UUID("0fdce689-20d9-41ad-ac41-f5640c5ff8c2")
TRIP = {
    "id": str(TRIP_ID),
    "owner_id": str(USER_ID),
    "name": "Manila Weekend",
    "image_url": None,
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
INVITE_TOKEN = "a" * 64
INVITATION = {
    "id": "47471c52-dd71-466f-8bdd-0255f460c0ef",
    "trip_id": str(TRIP_ID),
    "created_by": str(USER_ID),
    "invite_token": INVITE_TOKEN,
    "expires_at": "2026-08-26T00:00:00Z",
    "maximum_uses": 1,
    "use_count": 0,
    "is_active": True,
    "created_at": "2026-08-19T00:00:00Z",
}


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.trips: list[Mapping[str, object]] = [TRIP.copy()]
        self.create_values: Mapping[str, object] | None = None
        self.update_values: Mapping[str, object] | None = None
        self.invitation_values: Mapping[str, object] | None = None

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

    async def update_trip(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        assert user_id == USER_ID
        self.update_values = values
        return TRIP | dict(values)

    async def delete_trip(self, trip_id: UUID) -> None:
        if trip_id != TRIP_ID:
            raise SupabaseResourceNotFoundError("Trip was not found")
        self.trips = []

    async def create_trip_invitation(
        self,
        trip_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert trip_id == TRIP_ID
        self.invitation_values = values
        return INVITATION

    async def accept_trip_invitation(self, invite_token: str) -> Mapping[str, object]:
        if invite_token != INVITE_TOKEN:
            raise SupabaseInvalidInvitationError("Invalid invitation")
        return {
            "trip_id": str(TRIP_ID),
            "user_id": str(USER_ID),
            "role": "member",
            "joined_at": "2026-08-19T00:00:00Z",
        }


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


def test_update_trip_name_and_image() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.patch(
            f"/api/v1/trips/{TRIP_ID}",
            json={"name": "Japan Adventure", "image_url": "https://example.com/group.jpg"},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["name"] == "Japan Adventure"
    assert response.json()["image_url"] == "https://example.com/group.jpg"
    assert fake_supabase.update_values == {
        "name": "Japan Adventure",
        "image_url": "https://example.com/group.jpg",
    }


def test_unknown_trip_returns_not_found() -> None:
    fake_supabase = FakeSupabaseClient()
    unknown_id = UUID("f232d21e-6bb2-49dc-ac52-03bdaf9cb0c8")

    with authenticated_client(fake_supabase) as client:
        response = client.get(f"/api/v1/trips/{unknown_id}")

    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json() == {"detail": "Trip was not found"}


def test_create_and_accept_trip_invitation() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        create_response = client.post(
            f"/api/v1/trips/{TRIP_ID}/invitations",
            json={"expires_at": "2026-08-26T00:00:00Z", "maximum_uses": 1},
        )
        accept_response = client.post(f"/api/v1/invitations/{INVITE_TOKEN}/accept")

    app.dependency_overrides.clear()
    assert create_response.status_code == 201
    assert create_response.json()["invite_token"] == INVITE_TOKEN
    assert fake_supabase.invitation_values == {
        "expires_at": "2026-08-26T00:00:00Z",
        "maximum_uses": 1,
    }
    assert accept_response.status_code == 200
    assert accept_response.json()["id"] == str(TRIP_ID)


def test_invitation_share_url_opens_registered_app_scheme() -> None:
    response = TestClient(app).get(
        f"/api/v1/invitations/{INVITE_TOKEN}/open",
        follow_redirects=False,
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == "no-store"
    assert f"frontend://invite/{INVITE_TOKEN}" in response.text


def test_invitation_share_url_rejects_unsafe_token() -> None:
    response = TestClient(app).get("/api/v1/invitations/not%20safe/open")

    assert response.status_code == 400


def test_invalid_invitation_is_rejected_safely() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.post(f"/api/v1/invitations/{'b' * 64}/accept")

    app.dependency_overrides.clear()
    assert response.status_code == 400
    assert response.json() == {"detail": "Invitation is invalid, expired, or no longer active"}
