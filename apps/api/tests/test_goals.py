from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.clients.supabase import SupabaseResourceNotFoundError
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
GOAL_ID = UUID("51b41fd7-250e-4dcc-a489-8e59434ff8a6")
GOAL = {
    "id": str(GOAL_ID),
    "user_id": str(USER_ID),
    "goal_text": "Visit three museums",
    "created_at": "2026-08-19T00:00:00Z",
}


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.goals: list[Mapping[str, object]] = [GOAL.copy()]
        self.created_text: str | None = None

    async def list_travel_goals(self, user_id: UUID) -> list[Mapping[str, object]]:
        assert user_id == USER_ID
        return self.goals

    async def create_travel_goal(
        self,
        user_id: UUID,
        goal_text: str,
    ) -> Mapping[str, object]:
        assert user_id == USER_ID
        self.created_text = goal_text
        return GOAL

    async def delete_travel_goal(self, goal_id: UUID) -> None:
        if goal_id != GOAL_ID:
            raise SupabaseResourceNotFoundError("Travel goal was not found")
        self.goals = []


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_goals_require_access_token() -> None:
    app.dependency_overrides.clear()

    with TestClient(app) as client:
        response = client.get("/api/v1/me/goals")

    assert response.status_code == 401


def test_create_list_and_delete_travel_goal() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        create_response = client.post(
            "/api/v1/me/goals",
            json={"goal_text": " Visit three museums "},
        )
        list_response = client.get("/api/v1/me/goals")
        delete_response = client.delete(f"/api/v1/me/goals/{GOAL_ID}")

    app.dependency_overrides.clear()
    assert create_response.status_code == 201
    assert fake_supabase.created_text == "Visit three museums"
    assert list_response.status_code == 200
    assert list_response.json()[0]["goal_text"] == "Visit three museums"
    assert delete_response.status_code == 204
    assert fake_supabase.goals == []


def test_empty_goal_is_rejected() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.post("/api/v1/me/goals", json={"goal_text": "   "})

    app.dependency_overrides.clear()
    assert response.status_code == 422
    assert fake_supabase.created_text is None


def test_unknown_goal_returns_not_found() -> None:
    fake_supabase = FakeSupabaseClient()
    unknown_id = UUID("d192b83c-49dc-4ac0-9f8a-a9a67970dfab")

    with authenticated_client(fake_supabase) as client:
        response = client.delete(f"/api/v1/me/goals/{unknown_id}")

    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json() == {"detail": "Travel goal was not found"}
