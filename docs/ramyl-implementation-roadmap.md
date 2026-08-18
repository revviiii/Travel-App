# Ramyl implementation roadmap

Ramyl owns the database, core backend foundation, Google Places integration,
and Google Routes integration. Complete the steps in order; each step has a
working result that can be reviewed independently.

## 1. Protect and scaffold the repository

1. Work from a feature branch.
2. Populate `.gitignore` before creating `.env`.
3. Keep real credentials only in `.env` and deployment secret storage.
4. Run the health endpoint and its test.
5. Open a small pull request before adding product features.

Done when `GET /api/v1/health` returns 200 and `uv run pytest` passes.

## 2. Establish Supabase development

1. Create one team-owned Supabase development project.
2. Install the Supabase CLI and a Docker-compatible runtime.
3. Run `supabase init` from the repository root.
4. Run `supabase start` for the local stack.
5. Apply migrations with `supabase db reset`.
6. Link the hosted development project only after local migrations pass.
7. Preview remote changes with `supabase db push --dry-run`.
8. Apply approved migrations with `supabase db push`.

Never run `supabase db reset --linked` against production.

Done when a teammate can clone the repository, reset the local database, and
obtain the same schema.

## 3. Finish the core schema and authorization

1. Review the first migrations with the team.
2. Confirm that the UI word "Group" maps to the backend entity `trip`.
3. Create profiles automatically after Supabase Auth signup.
4. Add user preferences, trips, members, and invitations.
5. Enable RLS on every exposed table.
6. Test owner, member, non-member, and unauthenticated access separately.
7. Add an atomic database function for accepting invitation tokens.

Done when User A can create a trip, User B cannot read it before joining, and
User B can read it after accepting a valid invitation.

## 4. Build authenticated FastAPI endpoints

Current progress: Supabase access-token validation, `GET /api/v1/me`,
`PATCH /api/v1/me`, `GET /api/v1/me/preferences`, and
`PUT /api/v1/me/preferences` are implemented with mocked tests.

Priority after the August 19 frontend update:

1. Apply the preferences RPC migration and smoke-test these four endpoints
   against local Supabase.
2. Give frontend developers the API contract and have them replace mock
   login, signup, and preference actions with Supabase Auth plus these APIs.
3. Implement trip/group CRUD because the Home screen currently stores groups
   only in component state.
4. Add travel-goal storage because the Home screen currently stores goals only
   in component state.
5. Expose Google Places recommendations because Discovery still uses mock
   cards and a map placeholder.

Implement in this order:

```text
GET    /api/v1/me
PATCH  /api/v1/me
GET    /api/v1/me/preferences
PUT    /api/v1/me/preferences
POST   /api/v1/trips
GET    /api/v1/trips
GET    /api/v1/trips/{trip_id}
GET    /api/v1/trips/{trip_id}/members
POST   /api/v1/trips/{trip_id}/invitations
POST   /api/v1/invitations/{token}/accept
```

Validate the Supabase access token and enforce trip membership for every
trip-scoped request.

## 5. Configure Google Cloud safely

1. Create or select a team Google Cloud project.
2. Attach its billing account and set strict budget alerts and request quotas.
3. Enable Places API (New) and Routes API.
4. Create a server API key for FastAPI.
5. Restrict that key to only Places API and Routes API.
6. Add the key to `GOOGLE_MAPS_API_KEY` locally and to deployment secrets.
7. Never include the server key in React Native source or Git history.

Done when a single test request succeeds and the key is API-restricted.

## 6. Implement Google Places

1. Keep the Google HTTP request inside `GooglePlacesClient`.
2. Accept latitude, longitude, radius, category types, and result count.
3. Map UI preference labels to valid Google place types.
4. Call `POST https://places.googleapis.com/v1/places:searchNearby`.
5. Always send `X-Goog-FieldMask`; never use `*` in production.
6. Normalize Google's response into your own place response schema.
7. Cache only the data permitted by Google's current terms and refresh rules.
8. Store the stable Google Place ID with each pinned place.
9. Add timeouts and translate Google failures into safe API errors.
10. Unit-test the client with mocked HTTP responses before using real quota.

Suggested endpoint:

```text
POST /api/v1/trips/{trip_id}/recommendations/search
```

Done when mocked tests pass, one real search works, and repeated UI rendering
does not automatically repeat billable searches.

## 7. Implement Google Routes

1. Keep the request inside `GoogleRoutesClient`.
2. Accept origin, destination, and travel mode.
3. Call `POST https://routes.googleapis.com/directions/v2:computeRoutes`.
4. Always request an explicit field mask.
5. Normalize distance, duration, encoded polyline, and route legs.
6. Cache results using origin, destination, mode, and departure-time buckets.
7. Recalculate when itinerary ordering or travel mode changes.
8. Display Google's required attribution with route results.
9. Unit-test with mocked responses and only then make a live call.

Suggested endpoint:

```text
POST /api/v1/trips/{trip_id}/routes/compute
```

Done when the API returns normalized meters, seconds, and an encoded polyline
for two selected itinerary places.

## 8. Add places, votes, and itinerary storage

Add migrations for:

```text
places
trip_places
votes
itineraries
itinerary_items
route_cache
```

Enforce one vote per user and place with a unique constraint. Store itinerary
date, start time, order, estimated visit duration, and travel duration from the
previous item.

## 9. Integrate with the frontend

1. Keep `/openapi.json` current.
2. Give frontend developers example requests and responses.
3. Provide mock endpoints before live Google keys are required.
4. Agree on ISO 8601 timestamps and API error format.
5. Test the complete flow using two real Supabase test accounts.

## 10. Definition of complete

- Migrations reproduce the database from zero.
- RLS prevents cross-trip access.
- FastAPI tests pass.
- Google calls are mocked in normal tests.
- Real Google calls happen only in explicit integration tests.
- Field masks, quotas, caching, and key restrictions control cost.
- The mobile app can create a trip, discover a place, vote, add it to an
  itinerary, and retrieve a route.
