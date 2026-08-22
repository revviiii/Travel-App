from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
TRACK_ID = UUID("ca67480a-ab9c-4852-b327-f01e4992f604")
TRACK_CREATE = {
    "name": "Morning walk",
    "started_at": "2026-08-23T00:00:00Z",
    "ended_at": "2026-08-23T00:10:00Z",
    "duration_seconds": 600,
    "distance_meters": 850.5,
    "path": [
        {
            "latitude": 14.5995,
            "longitude": 120.9842,
            "recorded_at": "2026-08-23T00:00:00Z",
        },
        {
            "latitude": 14.6001,
            "longitude": 120.9850,
            "recorded_at": "2026-08-23T00:10:00Z",
        },
    ],
}
TRACK = {
    "id": str(TRACK_ID),
    "user_id": str(USER_ID),
    **TRACK_CREATE,
    "created_at": "2026-08-23T00:10:01Z",
}


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.tracks: list[Mapping[str, object]] = [TRACK.copy()]
        self.created_values: Mapping[str, object] | None = None

    async def list_travel_tracks(self, user_id: UUID) -> list[Mapping[str, object]]:
        assert user_id == USER_ID
        return self.tracks

    async def create_travel_track(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert user_id == USER_ID
        self.created_values = values
        return TRACK


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_tracks_require_access_token() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.get("/api/v1/me/tracks")

    assert response.status_code == 401


def test_create_and_list_travel_tracks() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        create_response = client.post("/api/v1/me/tracks", json=TRACK_CREATE)
        list_response = client.get("/api/v1/me/tracks")

    app.dependency_overrides.clear()
    assert create_response.status_code == 201
    assert create_response.json()["name"] == "Morning walk"
    assert fake_supabase.created_values is not None
    assert fake_supabase.created_values["distance_meters"] == 850.5
    assert list_response.status_code == 200
    assert list_response.json()[0]["id"] == str(TRACK_ID)


def test_track_requires_two_valid_points() -> None:
    fake_supabase = FakeSupabaseClient()
    invalid_track = TRACK_CREATE | {"path": TRACK_CREATE["path"][:1]}

    with authenticated_client(fake_supabase) as client:
        response = client.post("/api/v1/me/tracks", json=invalid_track)

    app.dependency_overrides.clear()
    assert response.status_code == 422
    assert fake_supabase.created_values is None
