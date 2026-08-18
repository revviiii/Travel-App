import asyncio

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
