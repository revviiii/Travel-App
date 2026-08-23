# Pinara technology steering

## Stack

- Expo SDK 54, React Native, TypeScript, and Expo Router for mobile.
- FastAPI, Python 3.12, Pydantic, HTTPX, pytest, and Ruff for the API.
- Supabase PostgreSQL, Auth, Realtime, Storage, migrations, and Row Level
  Security for persistence and authorization.
- Google Maps SDK for Android, Places API (New), and Routes API.
- Render Docker web service for the hosted API and EAS for native preview builds.

## Boundaries

- The mobile app may call Supabase Auth, Realtime, and Storage directly with a
  publishable key and the signed-in user's session.
- Business operations use FastAPI with `Authorization: Bearer <access-token>`.
- FastAPI calls Supabase with the same user access token so RLS remains active.
- Google Places/Routes web-service keys are server-only.
- The Android Maps SDK receives a separate package/SHA-1-restricted key at build
  time. It must never reuse the server key.

## API conventions

- All application endpoints live below `/api/v1`.
- Endpoint modules translate HTTP concerns; clients own external HTTP calls;
  services own normalization/business rules; Pydantic schemas define contracts.
- External provider failures become stable `502`, quota exhaustion becomes
  `503`, application throttling becomes `429`, and authorization failures remain
  `401`/`403`.
- Google field masks must be explicit. Do not replace them with `*`.
- Nearby results are capped at 20 and text-search results at 10.

## Database conventions

- Schema changes are append-only, timestamped SQL migrations in `supabase/migrations`.
- Every user-owned or group-owned table requires RLS policies.
- Multi-table operations such as group creation and invitation acceptance use
  database functions for atomicity.
- Never run `supabase db reset --linked` against the hosted project.

## Quality gates

```powershell
cd apps\api
uv run ruff check .
uv run ruff format --check .
uv run pytest

cd ..\..\frontend
npx tsc --noEmit
npm run lint
```

Provider calls must be mocked in automated tests so tests do not consume paid
quota. Secrets must not appear in source, examples, screenshots, or test data.
