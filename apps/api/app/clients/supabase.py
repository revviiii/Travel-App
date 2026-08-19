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
TRAVEL_GOAL_FIELDS = "id,user_id,goal_text,created_at"
TRIP_PLACE_FIELDS = "id,trip_id,place_id,suggested_by,created_at"
PLACE_FIELDS = (
    "id,google_place_id,name,address,latitude,longitude,primary_type,rating,"
    "google_data_refreshed_at"
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


class SupabaseTripPlaceAuthorizationError(SupabaseApiError):
    """Raised when a user cannot save a place to a trip."""


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

    async def list_travel_goals(self, user_id: UUID) -> list[Mapping[str, object]]:
        return await self._request_rows(
            "GET",
            "/rest/v1/travel_goals",
            params={
                "user_id": f"eq.{user_id}",
                "select": TRAVEL_GOAL_FIELDS,
                "order": "created_at.desc",
            },
        )

    async def create_travel_goal(
        self,
        user_id: UUID,
        goal_text: str,
    ) -> Mapping[str, object]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/travel_goals",
            params={"select": TRAVEL_GOAL_FIELDS},
            json={"user_id": str(user_id), "goal_text": goal_text},
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseApiError("Travel goal was not created")
        return rows[0]

    async def delete_travel_goal(self, goal_id: UUID) -> None:
        rows = await self._request_rows(
            "DELETE",
            "/rest/v1/travel_goals",
            params={"id": f"eq.{goal_id}", "select": "id"},
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseResourceNotFoundError("Travel goal was not found")

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

    async def list_trip_places(
        self,
        trip_id: UUID,
        user_id: UUID,
    ) -> list[Mapping[str, object]]:
        trip_places = await self._request_rows(
            "GET",
            "/rest/v1/trip_places",
            params={
                "trip_id": f"eq.{trip_id}",
                "select": TRIP_PLACE_FIELDS,
                "order": "created_at.desc",
            },
        )
        return await self._enrich_trip_places(trip_places, user_id)

    async def get_trip_place(
        self,
        trip_id: UUID,
        trip_place_id: UUID,
        user_id: UUID,
    ) -> Mapping[str, object]:
        trip_places = await self._request_rows(
            "GET",
            "/rest/v1/trip_places",
            params={
                "id": f"eq.{trip_place_id}",
                "trip_id": f"eq.{trip_id}",
                "select": TRIP_PLACE_FIELDS,
            },
        )
        if not trip_places:
            raise SupabaseResourceNotFoundError("Saved place was not found")
        return (await self._enrich_trip_places(trip_places, user_id))[0]

    async def save_trip_place(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        location = values["location"]
        if not isinstance(location, Mapping):
            raise ValueError("Place location is required")

        rows = await self._request_rows(
            "POST",
            "/rest/v1/rpc/save_trip_place",
            json={
                "target_trip_id": str(trip_id),
                "new_google_place_id": values["google_place_id"],
                "new_name": values["name"],
                "new_address": values.get("address"),
                "new_latitude": location["latitude"],
                "new_longitude": location["longitude"],
                "new_primary_type": values.get("primary_type"),
                "new_rating": values.get("rating"),
            },
            allow_object=True,
            error_type=SupabaseTripPlaceAuthorizationError,
        )
        if not rows:
            raise SupabaseApiError("Place was not saved")
        return await self.get_trip_place(trip_id, UUID(str(rows[0]["id"])), user_id)

    async def delete_trip_place(self, trip_id: UUID, trip_place_id: UUID) -> None:
        rows = await self._request_rows(
            "DELETE",
            "/rest/v1/trip_places",
            params={
                "id": f"eq.{trip_place_id}",
                "trip_id": f"eq.{trip_id}",
                "select": "id",
            },
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseResourceNotFoundError("Saved place was not found")

    async def add_trip_place_vote(
        self,
        trip_place_id: UUID,
        user_id: UUID,
    ) -> None:
        await self._request_rows(
            "POST",
            "/rest/v1/votes",
            params={"on_conflict": "trip_place_id,user_id", "select": "trip_place_id"},
            json={"trip_place_id": str(trip_place_id), "user_id": str(user_id)},
            headers={"Prefer": "resolution=ignore-duplicates,return=representation"},
        )

    async def remove_trip_place_vote(
        self,
        trip_place_id: UUID,
        user_id: UUID,
    ) -> None:
        await self._request_rows(
            "DELETE",
            "/rest/v1/votes",
            params={
                "trip_place_id": f"eq.{trip_place_id}",
                "user_id": f"eq.{user_id}",
                "select": "trip_place_id",
            },
            headers={"Prefer": "return=representation"},
        )

    async def _enrich_trip_places(
        self,
        trip_places: list[Mapping[str, object]],
        user_id: UUID,
    ) -> list[Mapping[str, object]]:
        if not trip_places:
            return []

        place_ids = [str(trip_place["place_id"]) for trip_place in trip_places]
        trip_place_ids = [str(trip_place["id"]) for trip_place in trip_places]
        places = await self._request_rows(
            "GET",
            "/rest/v1/places",
            params={
                "id": f"in.({','.join(place_ids)})",
                "select": PLACE_FIELDS,
            },
        )
        votes = await self._request_rows(
            "GET",
            "/rest/v1/votes",
            params={
                "trip_place_id": f"in.({','.join(trip_place_ids)})",
                "select": "trip_place_id,user_id",
            },
        )

        places_by_id = {str(place["id"]): place for place in places}
        vote_counts: dict[str, int] = {trip_place_id: 0 for trip_place_id in trip_place_ids}
        current_user_votes: set[str] = set()
        for vote in votes:
            trip_place_id = str(vote["trip_place_id"])
            vote_counts[trip_place_id] = vote_counts.get(trip_place_id, 0) + 1
            if str(vote["user_id"]) == str(user_id):
                current_user_votes.add(trip_place_id)

        enriched: list[Mapping[str, object]] = []
        for trip_place in trip_places:
            trip_place_id = str(trip_place["id"])
            place = places_by_id[str(trip_place["place_id"])]
            enriched.append(
                dict(trip_place)
                | {
                    "google_place_id": place["google_place_id"],
                    "name": place["name"],
                    "address": place["address"],
                    "location": {
                        "latitude": place["latitude"],
                        "longitude": place["longitude"],
                    },
                    "primary_type": place["primary_type"],
                    "rating": place["rating"],
                    "google_data_refreshed_at": place["google_data_refreshed_at"],
                    "vote_count": vote_counts[trip_place_id],
                    "current_user_voted": trip_place_id in current_user_votes,
                }
            )
        return enriched

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
