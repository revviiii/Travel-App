from collections.abc import Mapping
from uuid import UUID

import httpx

from app.schemas.profile import CurrentUser

PROFILE_FIELDS = (
    "id,full_name,avatar_url,country,phone_number,gender,preferred_language,"
    "onboarding_completed,created_at,updated_at"
)
TRIP_FIELDS = (
    "id,owner_id,name,destination_name,destination_latitude,destination_longitude,"
    "start_date,end_date,budget,status,created_at,updated_at"
)


class SupabaseAuthenticationError(RuntimeError):
    """Raised when Supabase rejects a user access token."""


class SupabaseApiError(RuntimeError):
    """Raised when a Supabase service cannot complete a valid request."""


class SupabaseResourceNotFoundError(SupabaseApiError):
    """Raised when a resource is missing or hidden by row-level security."""


class SupabaseInvitationAuthorizationError(SupabaseApiError):
    """Raised when a user cannot create an invitation for a trip."""


class SupabaseInvalidInvitationError(SupabaseApiError):
    """Raised when an invitation cannot be accepted."""


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

    async def create_trip(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        rpc_values = {f"new_{key}": value for key, value in values.items()}
        rows = await self._request_rows(
            "POST",
            "/rest/v1/rpc/create_trip_with_owner",
            json=rpc_values,
            allow_object=True,
        )
        if not rows:
            raise SupabaseApiError("Trip was not created")
        return dict(rows[0]) | {
            "member_count": 1,
            "current_user_role": "owner",
        }

    async def list_trips(self, user_id: UUID) -> list[Mapping[str, object]]:
        trips = await self._request_rows(
            "GET",
            "/rest/v1/trips",
            params={"select": TRIP_FIELDS, "order": "created_at.desc"},
        )
        return await self._add_trip_membership(trips, user_id)

    async def get_trip(self, trip_id: UUID, user_id: UUID) -> Mapping[str, object]:
        trips = await self._request_rows(
            "GET",
            "/rest/v1/trips",
            params={"id": f"eq.{trip_id}", "select": TRIP_FIELDS},
        )
        if not trips:
            raise SupabaseResourceNotFoundError("Trip was not found")
        return (await self._add_trip_membership(trips, user_id))[0]

    async def list_trip_members(self, trip_id: UUID) -> list[Mapping[str, object]]:
        return await self._request_rows(
            "GET",
            "/rest/v1/trip_members",
            params={
                "trip_id": f"eq.{trip_id}",
                "select": "user_id,role,joined_at",
                "order": "joined_at.asc",
            },
        )

    async def delete_trip(self, trip_id: UUID) -> None:
        rows = await self._request_rows(
            "DELETE",
            "/rest/v1/trips",
            params={"id": f"eq.{trip_id}", "select": "id"},
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseResourceNotFoundError("Trip was not found")

    async def create_trip_invitation(
        self,
        trip_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/rpc/create_trip_invitation",
            json={
                "target_trip_id": str(trip_id),
                "new_expires_at": values["expires_at"],
                "new_maximum_uses": values["maximum_uses"],
            },
            allow_object=True,
            error_type=SupabaseInvitationAuthorizationError,
        )
        if not rows:
            raise SupabaseApiError("Invitation was not created")
        return rows[0]

    async def accept_trip_invitation(self, invite_token: str) -> Mapping[str, object]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/rpc/accept_trip_invitation",
            json={"target_token": invite_token},
            allow_object=True,
            error_type=SupabaseInvalidInvitationError,
        )
        if not rows:
            raise SupabaseInvalidInvitationError(
                "Invitation is invalid, expired, or no longer active"
            )
        return rows[0]

    async def _add_trip_membership(
        self,
        trips: list[Mapping[str, object]],
        user_id: UUID,
    ) -> list[Mapping[str, object]]:
        if not trips:
            return []

        trip_ids = [str(trip["id"]) for trip in trips]
        members = await self._request_rows(
            "GET",
            "/rest/v1/trip_members",
            params={
                "trip_id": f"in.({','.join(trip_ids)})",
                "select": "trip_id,user_id,role",
            },
        )
        member_counts: dict[str, int] = {trip_id: 0 for trip_id in trip_ids}
        current_roles: dict[str, object] = {}
        for member in members:
            trip_id = str(member["trip_id"])
            member_counts[trip_id] = member_counts.get(trip_id, 0) + 1
            if str(member["user_id"]) == str(user_id):
                current_roles[trip_id] = member["role"]

        return [
            dict(trip)
            | {
                "member_count": member_counts[str(trip["id"])],
                "current_user_role": current_roles[str(trip["id"])],
            }
            for trip in trips
        ]

    async def _request_rows(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Mapping[str, object] | None = None,
        headers: Mapping[str, str] | None = None,
        allow_object: bool = False,
        error_type: type[SupabaseApiError] | None = None,
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

        if response.is_error and error_type is not None:
            try:
                error_payload = response.json()
            except ValueError:
                error_payload = {}
            message = error_payload.get("message")
            raise error_type(
                str(message) if message else "Supabase Data API rejected the request"
            )
        if response.is_error:
            raise SupabaseApiError("Supabase Data API rejected the request")

        payload = response.json()
        if allow_object and isinstance(payload, Mapping):
            return [payload]
        if not isinstance(payload, list):
            raise SupabaseApiError("Supabase Data API returned an invalid response")
        return payload
