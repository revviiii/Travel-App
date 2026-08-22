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
GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_SERVER_KEY
GOOGLE_PLACES_REQUESTS_PER_MINUTE=12
GOOGLE_ROUTES_REQUESTS_PER_MINUTE=20
CORS_ORIGINS=https://YOUR_FRONTEND_ORIGIN
```

The current API uses the caller's Supabase access token and the publishable key,
so it does not need a Supabase secret/service-role key. Do not add one to the
deployment unless the backend is deliberately changed to require privileged
database operations.

Never expose the Google server key through an `EXPO_PUBLIC_` variable. Restrict
it to Places API (New) and Routes API, then set project quotas and budget alerts
in Google Cloud.

## Recommended demo topology

The repository includes `render.yaml` for a Render web service in Singapore.
The service builds `apps/api/Dockerfile`, checks `/api/v1/health`, and prompts
for the three values that must not be committed:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `GOOGLE_MAPS_API_KEY`

Use a hosted Supabase project for Auth, PostgreSQL, and Realtime. The local
Docker project cannot be reached by teammates' phones and must not be placed in
the mobile build.

For a standalone Android build, create a second Google key restricted to Maps
SDK for Android. Store it in EAS as `GOOGLE_MAPS_ANDROID_API_KEY`; it is inserted
into the Android manifest by `frontend/app.config.js`. Do not reuse the private
Places/Routes server key in the APK.

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

## Hosted demo sequence

1. Create the hosted Supabase project in the Singapore region and record its
   project reference, URL, and publishable key.
2. Link the CLI and apply migrations with `supabase db push`; do not reset the
   hosted project.
3. Deploy the Render Blueprint from the repository and enter the three prompted
   backend environment values.
4. Verify `https://YOUR_SERVICE.onrender.com/api/v1/health` and `/docs`.
5. In Google Cloud, enable Maps SDK for Android and create the separate
   Android-restricted key for package `com.revviiii.travelapp` and the EAS
   signing-certificate SHA-1.
6. Set the preview EAS environment variables:

   ```powershell
   npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT.supabase.co --environment preview --visibility plaintext
   npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_PUBLISHABLE_KEY --environment preview --visibility sensitive
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://YOUR_SERVICE.onrender.com --environment preview --visibility plaintext
   npx eas-cli@latest env:set --name GOOGLE_MAPS_ANDROID_API_KEY --value YOUR_ANDROID_KEY --environment preview --visibility sensitive
   ```

7. From `frontend`, run `npx eas-cli@latest build --platform android --profile
   preview`. Share the resulting APK link only with the demo team.
