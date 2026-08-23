# Pinara

Pinara is a collaborative mobile travel planner that helps a group discover real
places, vote on proposed stops, agree on a schedule, navigate between stops, and
save a record of places visited. It was created for the Ready, Spec, Ship
Hackathon using Kiro.

## Project description

Planning a group trip usually scatters decisions across chat messages, map
links, polls, and personal calendars. Pinara gives the group one shared flow:

1. Create an account and choose travel interests.
2. Create or join a travel group.
3. Search any destination or discover nearby places from Google Places.
4. Propose a place with a date and time.
5. Vote as a group or let the group leader finalize the plan.
6. View the confirmed itinerary chronologically, open routes, and export
   confirmed stops to a device calendar.
7. Record and save a travelled path in **My Tracks**.

### Key features

- Email/password authentication and Google sign-in through Supabase Auth.
- Personal profiles, avatars, travel preferences, and travel goals.
- Persistent groups, members, group images, and secure invitation links.
- Destination search, nearby recommendations, place photos, and adjustable
  search radius using Google Places API (New).
- Google Maps markers, place links, and route polylines from the Routes API.
- Scheduled place proposals, optional group voting, leader finalization, and a
  chronological shared itinerary.
- Confirmed-only export to Google or device calendars.
- Realtime refresh for group members, votes, places, itinerary, and goals.
- Foreground route recording with saved travel tracks.
- No paid generative-AI dependency. Itineraries are created from member choices,
  votes, dates, times, and leader decisions.

## Working demo and test access

| Resource | Link | Notes |
| --- | --- | --- |
| Android preview APK | [Download the verified Pinara preview](https://expo.dev/artifacts/eas/PYwLjKGOGsN2rTM0g-FslgDJQwoUKaHTaQwHMVt-ULk.apk) | Android 6+ device or Google-enabled emulator; no Expo account required |
| Hosted API health | [travel-app-api health](https://travel-app-api-661e.onrender.com/api/v1/health) | A first request can take about one minute while the free Render service wakes |
| Interactive API docs | [FastAPI Swagger UI](https://travel-app-api-661e.onrender.com/docs) | Protected operations require a Supabase user access token |

The application is free to test. There are no shared credentials to leak or
expire: select **Sign Up**, enter a unique test email and a password of at least
eight characters, then complete onboarding. Email confirmation is disabled for
the demo project. Judges can use email/password even if Google OAuth remains in
provider testing mode.

The preview uses the hosted Supabase project and Render API. Do not start Docker,
Supabase, FastAPI, or Expo when using the installed APK.

## Team and contributions

- **Leigh Dela Cruz** — frontend implementation and demo video.
- **Revinea Labiano** — frontend implementation and documentation.
- **Ramyl Salazar** — complete FastAPI backend, Supabase database and security,
  deployment, Google Places integration, and Google Routes integration.

All substantive project work was completed by the registered team during the
competition period. Direct dependencies and third-party services are attributed
below.

## Architecture

```text
Expo / React Native mobile app
    |-- Supabase Auth (email/password and Google OAuth)
    |-- Supabase Realtime (group refresh events)
    `-- FastAPI /api/v1 (authenticated business operations)
            |-- Supabase PostgreSQL + Row Level Security
            |-- Supabase Storage (profile and group images)
            |-- Google Places API (New)
            `-- Google Routes API
```

The mobile app receives the user's Supabase session and sends only the access
token to FastAPI. Google web-service keys remain server-side. The Android map
key is separate, restricted to the Android package and signing certificate, and
is injected by EAS at build time.

## Repository layout

```text
.kiro/             Kiro specs and steering materials used during development
apps/api/          Python 3.12 FastAPI service and automated tests
docs/              Architecture, API, deployment, and testing guides
frontend/          Expo SDK 54 React Native application
supabase/          Versioned PostgreSQL migrations, RLS policies, and seed data
.env.example       Safe backend/local-service configuration template
render.yaml        Reproducible Render Blueprint for the hosted API
```

## Quick local setup

These instructions reproduce the complete stack on Windows PowerShell. The
detailed cross-platform and physical-phone variants are in
[`docs/full-stack-local-testing-guide.md`](docs/full-stack-local-testing-guide.md)
and [`docs/phone-testing-guide.md`](docs/phone-testing-guide.md).

### Prerequisites

- Git
- Node.js 20.19+ (Node 22 LTS recommended) and npm
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- Docker Desktop with WSL 2, or another Docker-compatible runtime
- Android Studio with a Google-enabled emulator, or a physical phone with Expo Go
- A Google Cloud project with billing enabled only if live Places/Routes testing
  is required

### 1. Clone or update the repository

```powershell
git clone https://github.com/revviiii/Travel-App.git Travel-App-1
cd Travel-App-1
git switch main
git pull --ff-only origin main
```

### 2. Install dependencies

```powershell
cd apps\api
uv sync

cd ..\..\frontend
npm ci

cd ..
```

### 3. Start the local Supabase stack

Start Docker Desktop first, then run from the repository root:

```powershell
npx supabase start
npx supabase db reset
npx supabase status
```

`db reset` recreates the local database from the checked-in migrations and seed.
Do not run it with `--linked` against the hosted project. The default local URLs
are Supabase API/Auth on `http://127.0.0.1:54421`, Studio on
`http://127.0.0.1:54423`, and Mailpit on `http://127.0.0.1:54424`.

### 4. Configure the backend

```powershell
Copy-Item .env.example .env
```

Open the ignored `.env` and insert the local publishable key printed by
`npx supabase status`. A restricted Google server key is needed only for live
place and route calls.

```dotenv
APP_ENV=development
APP_NAME=Pinara API
API_V1_PREFIX=/api/v1
SUPABASE_URL=http://127.0.0.1:54421
SUPABASE_PUBLISHABLE_KEY=YOUR_LOCAL_PUBLISHABLE_KEY
GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_SERVER_KEY
GOOGLE_PLACES_REQUESTS_PER_MINUTE=12
GOOGLE_ROUTES_REQUESTS_PER_MINUTE=20
CORS_ORIGINS=http://localhost:8081
```

The backend deliberately does not require a Supabase service-role or secret key.
Authorization is enforced with the caller's access token and database RLS.

### 5. Configure the frontend

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

For the Android Emulator, set:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54421
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_LOCAL_PUBLISHABLE_KEY
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

For a physical phone, replace `10.0.2.2` with the computer's Wi-Fi IPv4 address
and keep the phone and computer on the same network. Never put a Supabase secret
key or Google server key in an `EXPO_PUBLIC_` variable because those values are
embedded in the client bundle.

### 6. Run the services

Keep the backend and frontend commands running in separate terminals.

```powershell
# Terminal 1, from apps/api
uv run fastapi dev
```

```powershell
# Terminal 2, from frontend
npx expo start --android --clear
```

Open `http://127.0.0.1:8000/docs` for the local API and
`http://127.0.0.1:54423` for the local database dashboard.

## Required configuration

| Variable | Used by | Required | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | FastAPI | Yes | Supabase Auth/Data API base URL |
| `SUPABASE_PUBLISHABLE_KEY` | FastAPI | Yes | Validates and forwards user-scoped requests; safe to expose as designed by Supabase |
| `GOOGLE_MAPS_API_KEY` | FastAPI | For live maps search/routes | Server-restricted Places API (New) and Routes API key |
| `GOOGLE_PLACES_REQUESTS_PER_MINUTE` | FastAPI | No; defaults to `12` | Per-user Places and photo throttle |
| `GOOGLE_ROUTES_REQUESTS_PER_MINUTE` | FastAPI | No; defaults to `20` | Per-user Routes throttle |
| `CORS_ORIGINS` | FastAPI | No | Comma-separated allowed frontend origins |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile app | Yes | Supabase project used by the client |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Mobile app | Yes | Supabase client publishable key |
| `EXPO_PUBLIC_API_URL` | Mobile app | Yes | FastAPI base URL |
| `GOOGLE_MAPS_ANDROID_API_KEY` | EAS build only | Native Android map | Android-restricted Maps SDK key injected by `app.config.js` |

For Google Cloud setup, enable **Places API (New)**, **Routes API**, and
**Maps SDK for Android**. Use one server key restricted to the two web-service
APIs and a different Android key restricted to `com.revviiii.travelapp` plus the
correct SHA-1 certificate. See
[`docs/google-maps-integration.md`](docs/google-maps-integration.md).

## Usage instructions

1. Launch Pinara and create an account or log in.
2. Allow location access or search for a different destination manually.
3. Choose the initial travel interests and finish the profile.
4. On **Group**, create a group or open an invitation link.
5. Open a group and select **Add New** to search or discover places.
6. Choose a place, date, time, and whether members should vote (leader only).
7. Use **Itinerary** to vote, finalize accepted places, view the timeline, open
   Google Maps details/routes, and sync confirmed places to a calendar.
8. Use **Goals** for personal or shared travel goals.
9. Use **My Tracks** to start foreground location recording, stop it, review the
   highlighted path, and save or discard the track.
10. Long-press a group card or use its `...` menu to rename it, change its
    image, or delete it when authorized.

## Testing instructions

### Automated checks

Backend tests mock Google provider traffic and do not consume API quota.

```powershell
cd apps\api
uv run ruff check .
uv run ruff format --check .
uv run pytest

cd ..\..\frontend
npx tsc --noEmit
npm run lint
```

### Manual end-to-end test

Use two independently created accounts for collaboration testing:

- Sign up, complete onboarding, log out, and log in again.
- Create a group, change its name/image, and produce an invitation link.
- Accept the link with the second account and confirm both members appear.
- Search a destination other than the current location.
- Change interests and radius; confirm recommended results refresh.
- Open a place photo and its Google Maps details link.
- Schedule two places, vote from both accounts, and finalize the itinerary.
- Compute/view a route and export only confirmed places to a writable calendar.
- Add personal and group goals and confirm both accounts receive refreshed data.
- Record, review, save, and list a test travel track.

The exhaustive test matrix and troubleshooting steps are in
[`docs/full-stack-local-testing-guide.md`](docs/full-stack-local-testing-guide.md).

### Test credentials

No shared production or test password is stored in this repository. Judges
should create a disposable account through **Sign Up**. This avoids publishing a
reusable credential and allows each judge to test group invitations with a
separate account. Passwords must contain at least eight characters.

## API and service costs, rate limits, and restrictions

Pricing and quotas can change. The values below were reviewed on August 24,
2026; use the linked provider pages for the current terms.

| Service | Cost used by this submission | Limits and restrictions relevant to Pinara |
| --- | --- | --- |
| Google Maps SDK for Android | Billing account and restricted key required; Maps SDK currently has an unlimited free usage cap | Google attribution must remain visible; Android key must be package/SHA-1 restricted |
| Google Places API (New) | Pay-as-you-go by SKU/field mask after the applicable free usage cap; place-photo media can be a separate SKU | Pinara allows at most 20 nearby results, 10 text-search results, a 20 km nearby radius, and throttles Places/photo traffic to 12 requests per user per minute by default |
| Google Routes API | Pay-as-you-go; Compute Routes Essentials currently includes 10,000 free monthly requests before volume pricing | Google permits up to 3,000 Compute Routes queries/minute; Pinara applies the stricter 20 requests per user per minute default and requests one route without alternatives |
| Supabase | Hosted demo uses the Free plan (`$0`) | Current Free plan: 2 active projects, 50,000 MAU, 500 MB database, 1 GB storage, 5 GB egress; a project can pause after one week of inactivity |
| Render | API uses a Free web service (`$0`) | Spins down after 15 minutes without inbound traffic, can take about one minute to wake, uses an ephemeral filesystem, and shares 750 free instance hours/workspace/month |
| Expo / EAS | Expo CLI is free; the preview uses limited Free-plan EAS Build capacity | Free builds are lower priority and subject to the account's monthly build allowance; Expo Go cannot complete Pinara's custom-scheme Google OAuth callback |

Provider references:

- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Places API usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Routes API usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Supabase pricing](https://supabase.com/pricing)
- [Render Free service limits](https://render.com/docs/free)
- [Expo plans](https://docs.expo.dev/billing/plans/)

## Third-party attribution

| Project/service/material | Use in Pinara | Licence or terms |
| --- | --- | --- |
| [React](https://react.dev/) and [React Native](https://reactnative.dev/) | Mobile UI runtime | MIT |
| [Expo](https://expo.dev/) and Expo SDK modules | Development runtime, location, calendar, images, auth browser, builds | MIT packages; Expo service terms apply |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation | MIT |
| [React Navigation](https://reactnavigation.org/) | Navigation primitives | MIT |
| [react-native-maps](https://github.com/react-native-maps/react-native-maps) | Native map rendering | MIT; Google Maps terms apply to Google provider data |
| [Supabase JavaScript](https://github.com/supabase/supabase-js) | Auth, Realtime, and Storage client | MIT; Supabase service terms apply |
| [FastAPI](https://fastapi.tiangolo.com/) | Backend HTTP API and OpenAPI docs | MIT |
| [Pydantic](https://docs.pydantic.dev/) / pydantic-settings | Validation and configuration | MIT |
| [HTTPX](https://www.python-httpx.org/) | Async provider and Supabase HTTP client | BSD-3-Clause |
| [PostgreSQL](https://www.postgresql.org/) and Supabase CLI | Database, migrations, and local development | PostgreSQL licence / Apache-2.0 components |
| [Google Maps Platform](https://mapsplatform.google.com/) | Map tiles, place data/photos, attribution, and routes | Google Maps Platform Terms; provider attribution is retained in the UI |
| [Ionicons](https://ionic.io/ionicons) and Material Design icons through `@expo/vector-icons` | Interface icons | MIT / Apache-2.0 as applicable |
| Pinara logo, onboarding illustrations, screenshots, and custom UI assets | Application branding and interface | Original team-created hackathon assets |

No third-party dataset is bundled. Place, map, photo, and route information is
requested from Google at runtime. Transitive package notices remain available in
`frontend/package-lock.json` and `apps/api/uv.lock`.

## How Kiro was used

Kiro was the team's primary development environment. Its use was substantive
rather than a one-time code-completion step:

- Converted the low-fidelity Figma workflow into requirements for onboarding,
  discovery, groups, voting, itinerary finalization, calendars, and tracks.
- Produced and refined the architecture separating Expo, FastAPI, Supabase, and
  Google provider clients.
- Broke the implementation into reviewable frontend, API, database migration,
  deployment, documentation, and testing tasks.
- Generated and revised FastAPI schemas/endpoints, Supabase migrations and RLS,
  Expo screens/components, and integration documentation under team direction.
- Used terminal feedback, screenshots, emulator testing, API responses, lint,
  type checks, and pytest results to diagnose bugs and iterate.
- Helped review security boundaries: no committed credentials, separate Google
  keys, user-scoped access tokens, RLS, field masks, and request throttling.

The committed [`.kiro`](.kiro/) directory contains the product/technology
steering files and requirements/design/tasks specification used to document this
workflow. Team members reviewed, tested, and directed all generated work.

## Security and privacy

- `.env`, `.env.local`, tokens, provider secrets, signing files, and local
  database state are ignored.
- Only safe `.env.example` templates are committed.
- The backend never returns the Google server key to a client.
- Database tables use Row Level Security and authenticated user-scoped calls.
- Group invitations are opaque, time-limited tokens.
- Location tracking starts only after explicit user action and foreground
  permission; an unsaved recording can be discarded before upload.
- Do not paste credentials into issues, screenshots, commits, or demo videos.

## Known limitations

- The public native preview is Android. iPhone testing uses Expo Go with
  email/password unless the team produces a separately signed iOS build.
- Google OAuth must be tested from the native Pinara build, not Expo Go.
- Render Free cold starts can delay the first API request.
- Calendar export needs a writable Google or device calendar on the phone.
- Route recording is foreground-only and is intended for a short demo, not
  background fitness tracking.
- Google recommendations depend on provider coverage, quota, and billing state.

## Additional documentation

- [Complete physical-phone testing guide](docs/phone-testing-guide.md)
- [Full-stack local testing guide](docs/full-stack-local-testing-guide.md)
- [Backend architecture](docs/architecture.md)
- [Backend API contracts](docs/api-contracts.md)
- [Google Maps integration](docs/google-maps-integration.md)
- [Backend deployment guide](docs/backend-deployment-guide.md)
- [Backend/database handoff](docs/backend-database-handoff.md)
