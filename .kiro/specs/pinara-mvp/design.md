# Pinara MVP design

## Design goals

- Keep paid provider credentials outside the mobile bundle.
- Let Supabase RLS remain the final authorization boundary.
- Normalize Google responses so the frontend does not depend on provider JSON.
- Make group decisions deterministic and inspectable rather than AI-generated.
- Support a simple hosted demo and a fully reproducible local stack.

## Components

### Expo mobile client

Expo Router screens own navigation and compose reusable components. The client
uses Supabase JS for sessions, Realtime subscriptions, and permitted Storage
uploads. `frontend/lib/api.ts` attaches the current access token to FastAPI
requests and converts non-success responses into user-facing errors.

Discovery owns the selected search center, radius, active interest filters,
provider results, marker selection, and bottom-sheet state. It calls FastAPI for
nearby/text search, photos, and routes. It does not contain a Google web-service
key.

### FastAPI service

`app/api/v1/endpoints` validates HTTP inputs and authentication. Provider clients
perform HTTP calls with explicit field masks. Services normalize provider data,
map preference keys to place types, build deterministic itineraries, and enforce
per-process sliding-window throttles.

The API forwards the caller's bearer token and publishable key to Supabase. It
does not use a service-role key, preventing the backend from bypassing RLS during
ordinary user operations.

### Supabase

Auth owns identities. PostgreSQL owns profiles, preferences, groups/trips,
memberships, invitations, goals, places, votes, proposals, itineraries, and
tracks. Migrations define constraints, indexes, helper functions, grants, RLS,
Storage buckets, and Realtime publication. Storage owns profile and group images.

### External providers

- Google Maps SDK renders the native map and provider attribution.
- Places API (New) supplies nearby/text search, place IDs, labels, addresses,
  coordinates, types, and photo references.
- Routes API supplies distance, duration, legs, and encoded polylines.
- Render runs the Dockerized API; Supabase and EAS provide managed demo services.

## Key data flow

```text
User action
  -> Expo validates input and obtains Supabase session
  -> FastAPI validates bearer token
  -> Supabase user-scoped request enforces RLS
  -> optional Google provider request through server-only key
  -> normalized response returned to Expo
  -> mutation emits/causes Realtime refresh for group clients
```

## Itinerary state

A scheduled place begins undecided. If voting is disabled, the leader may
finalize it. If voting is enabled, member votes are recorded uniquely and the
proposal becomes confirmed when the required decision rule succeeds. Finalizing
preserves user-selected dates/times and returns a chronological itinerary. The
client exports only confirmed items; calendar credentials never reach FastAPI.

## Failure handling

- Missing/expired session: `401` and re-authentication.
- Authenticated but unauthorized group action: `403`/RLS rejection.
- Invalid request: `422` with structured validation information.
- Application map throttle: `429` with `Retry-After`.
- Provider quota unavailable: `503`.
- Other provider/network failure: stable `502` message.
- Free Render cold start: client/user retries after health endpoint wakes.

## Security decisions

- Ignore all real environment files and signing material.
- Commit only placeholders and documented variable names.
- Use separate Android and server Google keys with API/application restrictions.
- Limit fields, result counts, radius, and requests per user.
- Validate invitation tokens and expire them after seven days.
- Request location/photo/calendar permissions only for the corresponding action.
