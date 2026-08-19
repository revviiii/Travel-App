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
