from collections.abc import Mapping
from uuid import UUID

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_supabase_client
from app.clients.supabase import SupabaseResourceNotFoundError
from app.main import app
from app.schemas.profile import CurrentUser

USER_ID = UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a")
TRIP_ID = UUID("0fdce689-20d9-41ad-ac41-f5640c5ff8c2")
GOAL_ID = UUID("9e4b6b5c-04d8-401a-8336-6e62f833250f")


class FakeSupabaseClient:
    def __init__(self) -> None:
        self.goals: list[Mapping[str, object]] = []

    async def list_group_goals(self, trip_id: UUID) -> list[Mapping[str, object]]:
        assert trip_id == TRIP_ID
        return self.goals

    async def create_group_goal(
        self,
        trip_id: UUID,
        user_id: UUID,
        goal_text: str,
    ) -> Mapping[str, object]:
        goal = {
            "id": str(GOAL_ID),
            "trip_id": str(trip_id),
            "created_by": str(user_id),
            "goal_text": goal_text,
            "created_at": "2026-08-22T00:00:00Z",
        }
        self.goals = [goal]
        return goal

    async def delete_group_goal(self, trip_id: UUID, goal_id: UUID) -> None:
        assert trip_id == TRIP_ID
        if goal_id != GOAL_ID or not self.goals:
            raise SupabaseResourceNotFoundError("Group goal was not found")
        self.goals = []


def authenticated_client(fake_supabase: FakeSupabaseClient) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=USER_ID,
        email="ramyl@example.com",
    )
    app.dependency_overrides[get_supabase_client] = lambda: fake_supabase
    return TestClient(app)


def test_group_goal_create_list_and_delete() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        create_response = client.post(
            f"/api/v1/trips/{TRIP_ID}/goals",
            json={"goal_text": " Try three local foods "},
        )
        list_response = client.get(f"/api/v1/trips/{TRIP_ID}/goals")
        delete_response = client.delete(f"/api/v1/trips/{TRIP_ID}/goals/{GOAL_ID}")

    app.dependency_overrides.clear()
    assert create_response.status_code == 201
    assert create_response.json()["goal_text"] == "Try three local foods"
    assert list_response.json()[0]["trip_id"] == str(TRIP_ID)
    assert delete_response.status_code == 204


def test_missing_group_goal_returns_not_found() -> None:
    fake_supabase = FakeSupabaseClient()

    with authenticated_client(fake_supabase) as client:
        response = client.delete(f"/api/v1/trips/{TRIP_ID}/goals/{GOAL_ID}")

    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json() == {"detail": "Group goal was not found"}
