from collections.abc import Mapping
from uuid import UUID

import httpx

from app.schemas.profile import CurrentUser

PROFILE_FIELDS = (
    "id,full_name,avatar_url,country,phone_number,gender,preferred_language,"
    "onboarding_completed,created_at,updated_at"
)


class SupabaseAuthenticationError(RuntimeError):
    """Raised when Supabase rejects a user access token."""


class SupabaseApiError(RuntimeError):
    """Raised when a Supabase service cannot complete a valid request."""


class SupabaseClient:
    def __init__(
        self,
        base_url: str,
        publishable_key: str,
        access_token: str,
        http_client: httpx.AsyncClient,
    ) -> None:
        if not base_url or not publishable_key or not access_token:
            raise ValueError("Supabase URL, publishable key, and access token are required")

        self._base_url = base_url.rstrip("/")
        self._publishable_key = publishable_key
        self._access_token = access_token
        self._http_client = http_client

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "apikey": self._publishable_key,
            "Authorization": f"Bearer {self._access_token}",
        }

    async def get_current_user(self) -> CurrentUser:
        try:
            response = await self._http_client.get(
                f"{self._base_url}/auth/v1/user",
                headers=self._headers,
            )
        except httpx.RequestError as exc:
            raise SupabaseApiError("Supabase Auth is unavailable") from exc

        if response.status_code in {401, 403}:
            raise SupabaseAuthenticationError("Invalid or expired access token")
        if response.is_error:
            raise SupabaseApiError("Supabase Auth returned an unexpected response")

        return CurrentUser.model_validate(response.json())

    async def get_profile(self, user_id: UUID) -> Mapping[str, object]:
        rows = await self._request_rows(
            "GET",
            "/rest/v1/profiles",
            params={"id": f"eq.{user_id}", "select": PROFILE_FIELDS},
        )
        if not rows:
            raise SupabaseApiError("Authenticated user profile was not found")
        return rows[0]

    async def update_profile(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        rows = await self._request_rows(
            "PATCH",
            "/rest/v1/profiles",
            params={"id": f"eq.{user_id}", "select": PROFILE_FIELDS},
            json=dict(values),
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseApiError("Authenticated user profile was not updated")
        return rows[0]

    async def get_preferences(self, user_id: UUID) -> list[str]:
        rows = await self._request_rows(
            "GET",
            "/rest/v1/user_preferences",
            params={
                "user_id": f"eq.{user_id}",
                "select": "preference_key",
                "order": "created_at.asc",
            },
        )
        return [str(row["preference_key"]) for row in rows]

    async def replace_preferences(self, preference_keys: list[str]) -> list[str]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/rpc/replace_user_preferences",
            json={"new_preference_keys": preference_keys},
        )
        return [str(row["preference_key"]) for row in rows]

    async def _request_rows(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Mapping[str, object] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> list[Mapping[str, object]]:
        request_headers = self._headers | dict(headers or {})

        try:
            response = await self._http_client.request(
                method,
                f"{self._base_url}{path}",
                params=params,
                json=json,
                headers=request_headers,
            )
        except httpx.RequestError as exc:
            raise SupabaseApiError("Supabase Data API is unavailable") from exc

        if response.is_error:
            raise SupabaseApiError("Supabase Data API rejected the request")

        payload = response.json()
        if not isinstance(payload, list):
            raise SupabaseApiError("Supabase Data API returned an invalid response")
        return payload
