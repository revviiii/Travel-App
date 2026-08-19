import asyncio
import json
from uuid import UUID

import httpx

from app.clients.supabase import SupabaseClient


def test_supabase_client_validates_token_with_auth_server() -> None:
    async def scenario() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert str(request.url) == "http://localhost:54321/auth/v1/user"
            assert request.headers["apikey"] == "publishable-key"
            assert request.headers["authorization"] == "Bearer user-token"
            return httpx.Response(
                200,
                json={
                    "id": "6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a",
                    "email": "ramyl@example.com",
                },
            )

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            client = SupabaseClient(
                "http://localhost:54321",
                "publishable-key",
                "user-token",
                http_client,
            )
            user = await client.get_current_user()

        assert str(user.id) == "6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a"
        assert user.email == "ramyl@example.com"

    asyncio.run(scenario())


def test_create_trip_accepts_single_object_rpc_response() -> None:
    async def scenario() -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            assert str(request.url) == (
                "http://localhost:54321/rest/v1/rpc/create_trip_with_owner"
            )
            assert json.loads(request.content) == {
                "new_name": "Manila Weekend",
                "new_destination_name": None,
            }
            return httpx.Response(
                200,
                json={
                    "id": "0fdce689-20d9-41ad-ac41-f5640c5ff8c2",
                    "owner_id": "6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a",
                    "name": "Manila Weekend",
                    "destination_name": None,
                    "destination_latitude": None,
                    "destination_longitude": None,
                    "start_date": None,
                    "end_date": None,
                    "budget": None,
                    "status": "planning",
                    "created_at": "2026-08-19T00:00:00Z",
                    "updated_at": "2026-08-19T00:00:00Z",
                },
            )

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
            client = SupabaseClient(
                "http://localhost:54321",
                "publishable-key",
                "user-token",
                http_client,
            )
            trip = await client.create_trip(
                UUID("6f7ce5df-ef53-46d4-a6f9-43ebf9b57b9a"),
                {"name": "Manila Weekend", "destination_name": None},
            )

        assert trip["name"] == "Manila Weekend"
        assert trip["member_count"] == 1
        assert trip["current_user_role"] == "owner"

    asyncio.run(scenario())
