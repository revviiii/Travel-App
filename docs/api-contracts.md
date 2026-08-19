# Backend API contracts

All authenticated endpoints require the Supabase user access token issued by
the mobile app's sign-in flow:

```http
Authorization: Bearer <supabase-user-access-token>
```

The publishable key is not a user token. Never send a Supabase secret key or
Google Maps server key from the mobile application.

## Profile

### `GET /api/v1/me`

Returns the authenticated user's profile created by the Auth signup trigger.

### `PATCH /api/v1/me`

Accepts any subset of:

```json
{
  "full_name": "Ramyl Salazar",
  "country": "Philippines",
  "preferred_language": "en",
  "onboarding_completed": true
}
```

The API derives the profile ID from the verified access token. Clients cannot
select another profile ID in the request body.

## Preferences

### `GET /api/v1/me/preferences`

Example response:

```json
{
  "preference_keys": ["food", "nature", "outdoors"]
}
```

### `PUT /api/v1/me/preferences`

Replaces the complete preference selection atomically. Sending an empty list
supports the Preferences screen's Skip action.

```json
{
  "preference_keys": ["food", "nature", "outdoors"]
}
```

The current frontend keys are `outdoors`, `city`, `culture`, `beaches`,
`nature`, `roadtrips`, `food`, `gym`, `bar`, `shopping`, `skiing`, `retreats`,
and `spa`.

## Maps

### `POST /api/v1/maps/places/nearby`

Returns normalized Google place markers for a center point, radius, and the
current frontend preference keys. See the
[Google Maps integration guide](google-maps-integration.md) for the request,
response, cost controls, and mobile handoff.

### `POST /api/v1/maps/routes/compute`

Returns normalized distance, duration, route legs, and an encoded polyline for
an origin, destination, and travel mode.

## Trips (called Groups in the UI)

### `POST /api/v1/trips`

Creates a trip and its owner membership in one database transaction.

```json
{
  "name": "Manila Weekend",
  "destination_name": "Manila"
}
```

### `GET /api/v1/trips`

Returns only trips visible to the authenticated member. Each item includes
`member_count` and `current_user_role` for the Home screen.

### `GET /api/v1/trips/{trip_id}`

Returns one visible trip, or `404` when it does not exist or RLS hides it.

### `GET /api/v1/trips/{trip_id}/members`

Returns the visible trip membership list.

### `DELETE /api/v1/trips/{trip_id}`

Deletes a trip only when the authenticated user is its owner. Related members
and invitations are removed by database cascades.

## Invitations

### `POST /api/v1/trips/{trip_id}/invitations`

Owners and admins can create a time-limited invitation. The default request
creates a one-use token that expires after seven days:

```json
{}
```

The response contains `invite_token`. Treat it like a temporary secret and
share it only with intended group members.

### `POST /api/v1/invitations/{invite_token}/accept`

Atomically adds the authenticated user as a trip member and returns the joined
trip. Acceptance is idempotent for an existing member. Invalid, expired,
inactive, and exhausted tokens all return the same safe `400` response.

## Travel goals

### `GET /api/v1/me/goals`

Returns the authenticated user's goals, newest first.

### `POST /api/v1/me/goals`

Creates a goal of up to 100 characters:

```json
{
  "goal_text": "Visit three museums"
}
```

### `DELETE /api/v1/me/goals/{goal_id}`

Deletes only a goal owned by the authenticated user. A missing goal or one
hidden by RLS returns `404`.

## Saved trip places and voting

### `POST /api/v1/trips/{trip_id}/places`

Saves a normalized Google Places result to a trip. Re-saving the same
`google_place_id` in one trip is idempotent and refreshes the stored Google
snapshot without creating a duplicate suggestion. The user must choose the
proposed date and time before saving:

```json
{
  "google_place_id": "ChIJ...",
  "name": "Uffizi Gallery",
  "address": "Florence, Italy",
  "location": { "latitude": 43.7687, "longitude": 11.2558 },
  "primary_type": "museum",
  "rating": 4.7,
  "scheduled_date": "2026-08-22",
  "scheduled_time": "09:00:00",
  "duration_minutes": 120,
  "voting_enabled": true
}
```

Any member may create a scheduled proposal. Only an owner/admin may set
`voting_enabled` to `false`; doing so confirms the proposal immediately as a
leader decision.

### `GET /api/v1/trips/{trip_id}/places`

Returns proposals in the itinerary with their chosen date/time,
`vote_count`, `required_vote_count`, `current_user_voted`, and `is_confirmed`.
`is_confirmed` becomes true when every current group member has voted or an
owner/admin has finalized the proposal.

### `DELETE /api/v1/trips/{trip_id}/places/{trip_place_id}`

The original suggester or a trip admin may remove a suggestion. Votes are
removed automatically by database cascade.

### `PUT /api/v1/trips/{trip_id}/places/{trip_place_id}/vote`

Adds the authenticated member's vote idempotently.
Returns `409` when the group leader disabled voting for the proposal.

### `DELETE /api/v1/trips/{trip_id}/places/{trip_place_id}/vote`

Removes the authenticated member's vote idempotently. The database primary key
enforces at most one vote per user and saved place.

## Shared itinerary

### `GET /api/v1/trips/{trip_id}/itinerary`

Returns the persisted itinerary and its ordered items to any trip member. It
returns JSON `null` when the trip does not have an itinerary yet. Each item
contains the matching saved-place snapshot needed by the mobile UI.

### `POST /api/v1/trips/{trip_id}/itinerary/finalize`

Atomically saves the shared itinerary and confirms all its scheduled
proposals. Only the trip owner or an admin may call it. No request body is
required. The backend preserves each proposal's user-selected date, time, and
duration and orders the result chronologically. It does not call a paid
itinerary provider.

The frontend may export only proposals whose `is_confirmed` value is true.
Calendar export happens locally through the device's selected writable
calendar; Supabase and FastAPI never receive calendar credentials.
