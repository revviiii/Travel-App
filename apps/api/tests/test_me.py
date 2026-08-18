from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
PROFILE = {
    "id": str(USER_ID),
    "full_name": "Ramyl Salazar",
    "avatar_url": None,
    "country": "Philippines",
    "phone_number": None,
    "gender": None,
    "preferred_language": "en",
    "onboarding_completed": False,
    "created_at": "2026-08-19T00:00:00Z",
    "updated_at": "2026-08-19T00:00:00Z",
}


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.profile = PROFILE.copy()
        self.preferences = ["food", "nature"]
        self.profile_update: Mapping[str, object] | None = None

    async def get_profile(self, user_id: UUID) -> Mapping[str, object]:
        assert user_id == USER_ID
        return self.profile

    async def update_profile(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        assert user_id == USER_ID
        self.profile_update = values
        self.profile.update(values)
        return self.profile

    async def get_preferences(self, user_id: UUID) -> list[str]:
        assert user_id == USER_ID
        return self.preferences

    async def replace_preferences(self, preference_keys: list[str]) -> list[str]:
        self.preferences = preference_keys
        return self.preferences


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_profile_requires_access_token() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.get("/api/v1/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_read_and_update_profile() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        read_response = client.get("/api/v1/me")
        update_response = client.patch(
            "/api/v1/me",
            json={"country": "Japan", "onboarding_completed": True},
        )

    app.dependency_overrides.clear()
    assert read_response.status_code == 200
    assert read_response.json()["full_name"] == "Ramyl Salazar"
    assert update_response.status_code == 200
    assert update_response.json()["country"] == "Japan"
    assert fake_supabase.profile_update == {
        "country": "Japan",
        "onboarding_completed": True,
    }


def test_replace_preferences_normalizes_and_deduplicates_keys() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.put(
            "/api/v1/me/preferences",
            json={"preference_keys": [" Food ", "nature", "food"]},
        )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == {"preference_keys": ["food", "nature"]}
