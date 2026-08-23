from collections.abc import Mapping
from uuid import UUID

import httpx

from app.schemas.profile import CurrentUser

PROFILE_FIELDS = (
    "id,full_name,avatar_url,country,phone_number,gender,preferred_language,"
    "onboarding_completed,created_at,updated_at"
)
TRIP_FIELDS = (
    "id,owner_id,name,image_url,destination_name,destination_latitude,destination_longitude,"
    "start_date,end_date,budget,status,created_at,updated_at"
)
TRAVEL_GOAL_FIELDS = "id,user_id,goal_text,created_at"
TRAVEL_TRACK_FIELDS = (
    "id,user_id,name,started_at,ended_at,duration_seconds,distance_meters,path,created_at"
)
TRIP_PLACE_FIELDS = (
    "id,trip_id,place_id,suggested_by,scheduled_date,scheduled_time,duration_minutes,"
    "voting_enabled,leader_finalized_at,leader_finalized_by,created_at"
)
PLACE_FIELDS = (
    "id,google_place_id,name,address,latitude,longitude,primary_type,rating,"
    "photo_name,google_data_refreshed_at"
)
ITINERARY_FIELDS = (
    "id,trip_id,created_by,title,summary,generation_method,start_date,end_date,"
    "created_at,updated_at"
)
ITINERARY_ITEM_FIELDS = (
    "id,itinerary_id,trip_place_id,day_number,position,start_time,duration_minutes,"
    "travel_time_from_previous_minutes,notes,created_at"
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


class SupabaseItineraryAuthorizationError(SupabaseApiError):
    """Raised when a user cannot replace a trip itinerary."""


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

    async def list_travel_tracks(self, user_id: UUID) -> list[Mapping[str, object]]:
        return await self._request_rows(
            "GET",
            "/rest/v1/travel_tracks",
            params={
                "user_id": f"eq.{user_id}",
                "select": TRAVEL_TRACK_FIELDS,
                "order": "created_at.desc",
            },
        )

    async def create_travel_track(
        self,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/travel_tracks",
            params={"select": TRAVEL_TRACK_FIELDS},
            json={"user_id": str(user_id)} | dict(values),
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseApiError("Travel track was not created")
        return rows[0]

    async def list_group_goals(self, trip_id: UUID) -> list[Mapping[str, object]]:
        return await self._request_rows(
            "GET",
            "/rest/v1/group_goals",
            params={
                "trip_id": f"eq.{trip_id}",
                "select": "id,trip_id,created_by,goal_text,created_at",
                "order": "created_at.desc",
            },
        )

    async def create_group_goal(
        self,
        trip_id: UUID,
        user_id: UUID,
        goal_text: str,
    ) -> Mapping[str, object]:
        rows = await self._request_rows(
            "POST",
            "/rest/v1/group_goals",
            params={"select": "id,trip_id,created_by,goal_text,created_at"},
            json={
                "trip_id": str(trip_id),
                "created_by": str(user_id),
                "goal_text": goal_text,
            },
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseApiError("Group goal was not created")
        return rows[0]

    async def delete_group_goal(self, trip_id: UUID, goal_id: UUID) -> None:
        rows = await self._request_rows(
            "DELETE",
            "/rest/v1/group_goals",
            params={
                "id": f"eq.{goal_id}",
                "trip_id": f"eq.{trip_id}",
                "select": "id",
            },
            headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise SupabaseResourceNotFoundError("Group goal was not found")

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

    async def update_trip(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        trips = await self._request_rows(
            "PATCH",
            "/rest/v1/trips",
            params={"id": f"eq.{trip_id}", "select": TRIP_FIELDS},
            json=values,
            headers={"Prefer": "return=representation"},
        )
        if not trips:
            raise SupabaseResourceNotFoundError("Trip was not found")
        return (await self._add_trip_membership(trips, user_id))[0]

    async def list_trip_members(self, trip_id: UUID) -> list[Mapping[str, object]]:
        members = await self._request_rows(
            "GET",
            "/rest/v1/trip_members",
            params={
                "trip_id": f"eq.{trip_id}",
                "select": (
                    "user_id,role,joined_at,"
                    "profile:profiles!trip_members_user_id_fkey("
                    "full_name,avatar_url,user_preferences(preference_key))"
                ),
                "order": "joined_at.asc",
            },
        )
        enriched: list[Mapping[str, object]] = []
        for member in members:
            profile_value = member.get("profile")
            profile = profile_value if isinstance(profile_value, Mapping) else {}
            preferences_value = profile.get("user_preferences", [])
            preferences = preferences_value if isinstance(preferences_value, list) else []
            enriched.append(
                {
                    "user_id": member["user_id"],
                    "role": member["role"],
                    "joined_at": member["joined_at"],
                    "full_name": profile.get("full_name"),
                    "avatar_url": profile.get("avatar_url"),
                    "preference_keys": [
                        str(preference["preference_key"])
                        for preference in preferences
                        if isinstance(preference, Mapping) and preference.get("preference_key")
                    ],
                }
            )
        return enriched

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
                "new_photo_name": values.get("photo_name"),
                "new_scheduled_date": values["scheduled_date"],
                "new_scheduled_time": values["scheduled_time"],
                "new_duration_minutes": values["duration_minutes"],
                "new_voting_enabled": values["voting_enabled"],
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

    async def get_trip_itinerary(
        self,
        trip_id: UUID,
        user_id: UUID,
    ) -> Mapping[str, object] | None:
        itineraries = await self._request_rows(
            "GET",
            "/rest/v1/itineraries",
            params={
                "trip_id": f"eq.{trip_id}",
                "select": ITINERARY_FIELDS,
            },
        )
        if not itineraries:
            return None

        itinerary = itineraries[0]
        items = await self._request_rows(
            "GET",
            "/rest/v1/itinerary_items",
            params={
                "itinerary_id": f"eq.{itinerary['id']}",
                "select": ITINERARY_ITEM_FIELDS,
                "order": "day_number.asc,position.asc",
            },
        )
        places = await self.list_trip_places(trip_id, user_id)
        places_by_id = {str(place["id"]): place for place in places}

        return dict(itinerary) | {
            "items": [
                dict(item) | {"place": places_by_id[str(item["trip_place_id"])]}
                for item in items
                if str(item["trip_place_id"]) in places_by_id
            ]
        }

    async def replace_trip_itinerary(
        self,
        trip_id: UUID,
        user_id: UUID,
        values: Mapping[str, object],
    ) -> Mapping[str, object]:
        await self._request_rows(
            "POST",
            "/rest/v1/rpc/replace_trip_itinerary",
            json={
                "target_trip_id": str(trip_id),
                "new_title": values["title"],
                "new_summary": values["summary"],
                "new_generation_method": values["generation_method"],
                "new_start_date": values["start_date"],
                "new_end_date": values["end_date"],
                "new_items": values["items"],
            },
            allow_object=True,
            error_type=SupabaseItineraryAuthorizationError,
        )
        itinerary = await self.get_trip_itinerary(trip_id, user_id)
        if itinerary is None:
            raise SupabaseApiError("Itinerary was not saved")
        return itinerary

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
        trip_ids = sorted({str(trip_place["trip_id"]) for trip_place in trip_places})
        members = await self._request_rows(
            "GET",
            "/rest/v1/trip_members",
            params={
                "trip_id": f"in.({','.join(trip_ids)})",
                "select": "trip_id,user_id",
            },
        )

        places_by_id = {str(place["id"]): place for place in places}
        vote_counts: dict[str, int] = {trip_place_id: 0 for trip_place_id in trip_place_ids}
        current_user_votes: set[str] = set()
        member_counts: dict[str, int] = {trip_id: 0 for trip_id in trip_ids}
        for member in members:
            trip_id = str(member["trip_id"])
            member_counts[trip_id] = member_counts.get(trip_id, 0) + 1
        for vote in votes:
            trip_place_id = str(vote["trip_place_id"])
            vote_counts[trip_place_id] = vote_counts.get(trip_place_id, 0) + 1
            if str(vote["user_id"]) == str(user_id):
                current_user_votes.add(trip_place_id)

        enriched: list[Mapping[str, object]] = []
        for trip_place in trip_places:
            trip_place_id = str(trip_place["id"])
            trip_id = str(trip_place["trip_id"])
            place = places_by_id[str(trip_place["place_id"])]
            required_vote_count = max(member_counts.get(trip_id, 0), 1)
            is_confirmed = trip_place["leader_finalized_at"] is not None or (
                bool(trip_place["voting_enabled"])
                and vote_counts[trip_place_id] >= required_vote_count
            )
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
                    "required_vote_count": required_vote_count,
                    "current_user_voted": trip_place_id in current_user_votes,
                    "is_confirmed": is_confirmed,
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
                "select": (
                    "trip_id,user_id,role,joined_at,"
                    "profile:profiles!trip_members_user_id_fkey(full_name,avatar_url)"
                ),
                "order": "joined_at.asc",
            },
        )
        member_counts: dict[str, int] = {trip_id: 0 for trip_id in trip_ids}
        current_roles: dict[str, object] = {}
        members_by_trip: dict[str, list[Mapping[str, object]]] = {trip_id: [] for trip_id in trip_ids}

        for member in members:
            trip_id = str(member["trip_id"])
            member_counts[trip_id] = member_counts.get(trip_id, 0) + 1
            if str(member["user_id"]) == str(user_id):
                current_roles[trip_id] = member["role"]
            members_by_trip.setdefault(trip_id, []).append(member)

        max_preview = 4
        enriched: list[Mapping[str, object]] = []
        for trip in trips:
            tid = str(trip["id"])
            preview: list[Mapping[str, object]] = []
            for m in members_by_trip.get(tid, [])[:max_preview]:
                profile_value = m.get("profile")
                profile = profile_value if isinstance(profile_value, Mapping) else {}
                preview.append({
                    "user_id": str(m["user_id"]),
                    "full_name": profile.get("full_name"),
                    "avatar_url": profile.get("avatar_url"),
                })
            enriched.append(
                dict(trip)
                | {
                    "member_count": member_counts[tid],
                    "current_user_role": current_roles[tid],
                    "member_preview": preview,
                }
            )
        return enriched

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
            raise error_type(str(message) if message else "Supabase Data API rejected the request")
        if response.is_error:
            raise SupabaseApiError("Supabase Data API rejected the request")

        payload = response.json()
        if allow_object and isinstance(payload, Mapping):
            return [payload]
        if not isinstance(payload, list):
            raise SupabaseApiError("Supabase Data API returned an invalid response")
        return payload
