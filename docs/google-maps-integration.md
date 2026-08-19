# Google Maps integration

Ramyl owns the server-side Google Places and Routes integrations. The mobile
application renders the map, markers, and polylines using the normalized API
responses documented below. The Google Web Service key must remain on the
FastAPI server.

## Google Cloud setup

1. Create or select the team's Google Cloud project and attach billing.
2. Enable **Places API (New)** and **Routes API**.
3. Create a dedicated server API key.
4. Restrict that key to Places API (New) and Routes API only.
5. Set conservative daily quotas and billing-budget alerts.
6. Put the key only in the repository-root `.env` file:

```env
GOOGLE_MAPS_API_KEY=your_restricted_server_key
```

Restart FastAPI after changing `.env` because settings are cached for the
process lifetime.

## Nearby map markers

`POST /api/v1/maps/places/nearby` requires a Supabase user bearer token.

Example request:

```json
{
  "center": {"latitude": 14.5995, "longitude": 120.9842},
  "radius_meters": 5000,
  "preference_keys": ["culture", "food"],
  "max_result_count": 10,
  "rank_preference": "POPULARITY"
}
```

Example marker response:

```json
{
  "center": {"latitude": 14.5995, "longitude": 120.9842},
  "radius_meters": 5000,
  "places": [
    {
      "place_id": "google-place-id",
      "name": "National Museum",
      "address": "Manila, Metro Manila",
      "location": {"latitude": 14.5869, "longitude": 120.9816},
      "primary_type": "museum",
      "rating": null
    }
  ],
  "provider": "google"
}
```

The backend translates the frontend preference IDs into valid Google Table A
place types. An empty preference list searches all supported place types in the
radius.

The default field mask intentionally excludes `rating` and `priceLevel` because
those fields move Nearby Search into Google's higher Enterprise SKU. The
nullable `rating` property keeps the frontend contract forward-compatible with
a future explicit details request.

When a user saves a recommendation, the database keeps the stable Google Place
ID plus the displayed snapshot and records `google_data_refreshed_at`. Re-saving
the place refreshes that snapshot and does not duplicate it inside the trip.

## Routes and map polylines

`POST /api/v1/maps/routes/compute` also requires a Supabase user bearer token.

```json
{
  "origin": {"latitude": 14.5995, "longitude": 120.9842},
  "destination": {"latitude": 14.5869, "longitude": 120.9816},
  "travel_mode": "WALK"
}
```

The response contains normalized meters, seconds, and Google's encoded
polyline. The mobile map must decode and render that polyline and display the
required Google attribution.

## Mobile handoff

The frontend team should:

1. Use `react-native-maps` for Expo SDK 54 (`npx expo install react-native-maps`).
2. Send the signed-in user's Supabase access token to FastAPI.
3. Render one marker for every item in `places` using its `location`.
4. Re-query only after a meaningful map move or explicit search action; do not
   issue a billable request on every render or tiny camera movement.
5. Debounce user-triggered searches and reuse results while the search center,
   radius, and preferences remain unchanged.
6. Render route polylines and Google attribution when showing Google data.

Expo Go can render `react-native-maps` without additional native setup. Store
builds require separate Android/iOS restricted map-rendering keys; those are
different from the server key used by FastAPI.
