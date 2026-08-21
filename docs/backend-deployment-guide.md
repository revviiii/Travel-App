# Backend deployment guide

The FastAPI service is deployable on any container host using
`apps/api/Dockerfile`. Supabase PostgreSQL/Auth and Google Maps remain managed
external services; do not place their secrets in the image.

## Required production environment

Set these in the host's encrypted secret/environment settings:

```dotenv
APP_ENV=production
APP_NAME=Travel App API
API_V1_PREFIX=/api/v1
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_SERVER_KEY
GOOGLE_PLACES_REQUESTS_PER_MINUTE=12
GOOGLE_ROUTES_REQUESTS_PER_MINUTE=20
CORS_ORIGINS=https://YOUR_FRONTEND_ORIGIN
```

Never expose the Supabase secret key or Google server key through an
`EXPO_PUBLIC_` variable. Restrict the Google key to Places API (New) and Routes
API, then set project quotas and budget alerts in Google Cloud.

## Pre-deployment checks

```powershell
cd apps\api
uv sync --frozen
uv run ruff check .
uv run ruff format --check .
uv run pytest
docker build -t travel-app-api .
```

Apply migrations to the intended Supabase project only after reviewing the
target. Never use `db reset --linked`:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

## Health and monitoring

Configure the host health check as `GET /api/v1/health` on port `8000`. Every
response includes `X-Request-ID`; FastAPI logs the same request ID, method,
path, status, and duration so a mobile error can be matched to server logs.
Forward container logs to the host's log viewer and alert on repeated `5xx`
responses or failed health checks.

After deployment, set `EXPO_PUBLIC_API_URL` to the HTTPS API base URL, rebuild
the mobile app, and run the complete checklist in
`docs/full-stack-local-testing-guide.md` against the development environment
before promoting it for the demo.
