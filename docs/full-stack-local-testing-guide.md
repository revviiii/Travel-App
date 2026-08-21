# Frontend, backend, and database local testing guide

This guide is for a teammate who only has the GitHub repository and has never
installed or run this project's backend or database. It uses Windows, Kiro,
PowerShell, the Android Emulator, local Supabase, and the local FastAPI server.

Ramyl owns the full backend and database. If an API request/response, migration,
security policy, port, or environment variable needs to change, coordinate the
change with Ramyl instead of creating a second backend implementation in the
frontend.

## What will run locally

Four processes must be available at the same time:

1. Docker Desktop runs the local Supabase containers.
2. Supabase provides PostgreSQL, Auth, Studio, Storage, and its Data API.
3. FastAPI provides the Travel App business API and calls Google Maps services.
4. Expo runs the React Native frontend in the Android Emulator.

The Android Emulator uses `10.0.2.2` to reach services running on the Windows
computer. Do not change the frontend URLs to `127.0.0.1`; inside the emulator,
that address means the emulator itself.

## Current integration status

| Feature | Current source of data | Expected test result |
| --- | --- | --- |
| Email signup and login | Supabase Auth | Connected |
| Profiles | Supabase PostgreSQL through FastAPI | Connected and editable in the app |
| Group creation/list/deletion | `trips` and `trip_members` tables | Connected and persistent |
| Travel goals | `travel_goals` table | Connected and persistent |
| Group goals | `group_goals` table | Connected, persistent, and live for members |
| Nearby recommendations | Google Places API through FastAPI | Connected when a valid Google key is configured |
| Route line/distance/duration | Google Routes API through FastAPI | Connected when a valid Google key is configured |
| Saved places and votes | Supabase tables through FastAPI | Connected and persistent |
| Preference screen | `user_preferences` through FastAPI | Connected and persistent |
| Invitations/members | Supabase through FastAPI | Connected with secure app invitation links |
| Shared itinerary | Member-selected dates/times, voting, and leader finalization through FastAPI | Connected and persistent |
| Calendar sync | Device calendar through Expo Calendar | Confirmed/orange places only |
| Live collaboration | Supabase Realtime with RLS | Votes and saved-place changes refresh for group members |
| Maps cost control | FastAPI per-user throttling and Google Cloud quotas | Connected; `429` prevents request bursts |

## 1. Pull the newest code first

Do this at the beginning of every work session.

Open the repository folder in Kiro, then open **Terminal > New Terminal**. The
terminal prompt should end in `Travel-App-1`.

```powershell
git status
git branch --show-current
git switch main
git pull --ff-only origin main
```

If Ramyl asks the team to test a feature branch instead, switch to that exact
branch and pull it:

```powershell
$testBranch = 'branch-name-from-Ramyl'
git switch $testBranch
git pull --ff-only origin $testBranch
```

Do not continue if `git status` shows changes you do not understand or if Git
reports a conflict. Do not discard the files. Send the full terminal output to
the teammate who owns those changes.

If the repository has not been cloned yet:

```powershell
cd "$env:USERPROFILE\Downloads"
git clone https://github.com/revviiii/Travel-App.git Travel-App-1
cd Travel-App-1
```

## 2. Install the one-time prerequisites

These are installed once per computer, not once per work session.

### Git

Install [Git for Windows](https://git-scm.com/download/win), reopen Kiro, and
verify:

```powershell
git --version
```

### Node.js and npm

Install a Node.js LTS release from the
[official Node.js download page](https://nodejs.org/en/download). Node 22 LTS
is recommended. Expo SDK 54 requires at least Node `20.19.x`.

```powershell
node --version
npm --version
```

### Docker Desktop and WSL 2

Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
with the WSL 2 backend. Hardware virtualization must be enabled. Start Docker
Desktop and wait until it says the engine is running.

```powershell
wsl --version
docker version
```

`docker version` must show both **Client** and **Server** information. If the
Server section is missing, Docker Desktop is not ready.

### uv and Python 3.12

Install `uv` using its official Windows package:

```powershell
winget install --id=astral-sh.uv -e
```

Close and reopen Kiro, then let `uv` install the Python version required by the
backend:

```powershell
uv --version
uv python install 3.12
```

### Android Studio and an emulator

Follow the [Expo Android Emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/).
Install Android Studio, Android SDK Platform 36, Android SDK Build-Tools,
Android Emulator, and Android SDK Platform-Tools. Create a Pixel Android Virtual
Device in Android Studio's Device Manager.

Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to the Windows user `Path`,
reopen Kiro, and verify:

```powershell
adb --version
```

## 3. Install repository dependencies

Run these commands from the repository root after pulling.

Backend dependencies:

```powershell
cd apps\api
uv sync
cd ..\..
```

Frontend dependencies:

```powershell
cd frontend
npm ci
cd ..
```

`npm ci` uses the committed lock file, so every teammate installs the same
frontend dependency versions. Normal Expo packages, the Supabase CLI, and the
backend Python packages do not need to be installed globally.

## 4. Start the database and obtain local keys

First open Docker Desktop and wait for the Docker engine. In a Kiro terminal at
the repository root, run:

```powershell
npx supabase start
npx supabase migration up
npx supabase status
```

On the first run, `npx` may ask permission to download the Supabase CLI and
Docker may download several images. Answer `y` and allow the downloads to
finish. `supabase start` applies the committed migrations and seed file.

Keep the `supabase status` output private. Copy these two values from it:

- **Publishable key**: safe for the mobile client, but still keep it in the
  ignored local environment file.
- **Secret key**: backend only. Never put it in `frontend`, chat, screenshots,
  source code, or Git.

Useful local addresses for this repository are:

| Service | Windows address |
| --- | --- |
| Supabase API/Auth | `http://127.0.0.1:54421` |
| PostgreSQL | `127.0.0.1:54422` |
| Supabase Studio | `http://127.0.0.1:54423` |
| Mailpit test email | `http://127.0.0.1:54424` |

Open `http://127.0.0.1:54423` to see the local database. This is a separate
database on each teammate's computer; it does not contain Ramyl's test users or
data.

## 5. Create the local environment files

Environment files are intentionally ignored by Git. Each teammate creates
their own files.

### Repository-root `.env` for FastAPI

From the repository root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Open `.env` in Kiro and set the keys printed by `npx supabase status`:

```dotenv
APP_ENV=development
APP_NAME=Travel App API
API_V1_PREFIX=/api/v1

SUPABASE_URL=http://127.0.0.1:54421
SUPABASE_PUBLISHABLE_KEY=<paste-local-publishable-key>
SUPABASE_SECRET_KEY=<paste-local-secret-key>

GOOGLE_MAPS_API_KEY=<obtain-from-Ramyl-securely>
GOOGLE_PLACES_REQUESTS_PER_MINUTE=12
GOOGLE_ROUTES_REQUESTS_PER_MINUTE=20

CORS_ORIGINS=http://localhost:8081
```

The Google key is required only for live nearby-place and route requests. Ask
Ramyl for the team's restricted development key through an approved private
channel. Never commit it. The key must be restricted to **Places API (New)** and
**Routes API**, with billing and quotas configured in Google Cloud.

### `frontend/.env.local` for the Android Emulator

From the repository root:

```powershell
if (-not (Test-Path frontend\.env.local)) {
  Copy-Item frontend\.env.example frontend\.env.local
}
```

Open `frontend/.env.local` and set:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54421
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<paste-the-same-local-publishable-key>
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

Never put `SUPABASE_SECRET_KEY` or `GOOGLE_MAPS_API_KEY` in an
`EXPO_PUBLIC_...` variable. Expo public variables are bundled into the app.

## 6. Start all services in the correct order

Use separate Kiro terminals. Do not type all commands into one terminal because
the backend and frontend commands remain running.

### Terminal 1: Supabase

If it is not already running:

```powershell
# Run from the Travel-App-1 repository root.
npx supabase start
```

Leave Docker Desktop running. The command itself may return to the prompt; the
containers continue in Docker.

### Terminal 2: FastAPI backend

```powershell
# A new Kiro terminal normally opens at the repository root.
cd apps\api
uv sync
uv run fastapi dev --host 0.0.0.0
```

Keep this terminal open. A successful start shows the API at
`http://127.0.0.1:8000` and documentation at
`http://127.0.0.1:8000/docs`.

### Android Emulator

Open Android Studio, choose **More Actions > Virtual Device Manager**, and press
the Play button for the team's Android Virtual Device. Wait for the Android home
screen.

### Terminal 3: Expo frontend

```powershell
# Open another Kiro terminal at the repository root.
cd frontend
npm ci
npx expo start --clear --android
```

Keep this terminal open. Expo should install/open Expo Go and load the Travel
App. For later starts, `npm run android` is enough unless Metro's cache is
causing a problem.

## 7. Verify the backend before testing the app

Open a fourth Kiro terminal and run:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

Expected values:

```text
status  healthy
service travel-app-api
```

Also open:

- `http://127.0.0.1:8000/docs` for the FastAPI endpoint list.
- `http://127.0.0.1:54423` for Supabase Studio.

If health works but authenticated app features do not, check the environment
keys and the user's login session rather than reinstalling the frontend.

## 8. Create a new local test account

Local accounts are not shared across computers and are deleted by a database
reset.

1. Open the app's Log In screen.
2. Tap **Sign up**.
3. Enter a full name, a unique test email, and a password of at least 8
   characters.
4. Tap **Sign Up**.
5. Choose or skip preferences and continue to Home.

Local email confirmation is disabled, so the session should be created
immediately. Social login buttons are still placeholders; use email/password.

To confirm the account exists, open Supabase Studio and select
**Authentication > Users**. Passwords cannot be viewed in Supabase. If a
password is forgotten, create another local account with a different email.

## 9. End-to-end frontend test checklist

Use a fresh local account and record the exact step, screenshot, frontend Metro
output, and FastAPI terminal error for any failure.

### Authentication

- Sign up with email/password and reach Home.
- Close and reopen the app; verify the session is still available.
- Log in again with the same credentials if the app returns to Log In.
- Verify the user appears under Supabase Studio **Authentication > Users**.
- Verify the matching row appears in **Table Editor > profiles**.

### Groups

- On Home, create a group with a unique name.
- Verify it appears immediately.
- Close/reopen the app and verify the group still appears.
- In Studio, verify rows in `trips` and `trip_members`.
- Long-press a group owned by the test user, confirm deletion, and verify both
  the UI and database update.
- Open a group and verify its real name, members, preferences, and saved-place
  count load instead of placeholder data.
- As its owner, create/share an invitation. Open the link while signed in as a
  second local account and verify that account joins the group.

### Travel goals

- Open the Goals tab and add a goal.
- Close/reopen the app and verify it remains.
- Verify the row in Studio's `travel_goals` table.
- Long-press the goal and delete it.

### Group goals

- Open a group, enter its Discovery screen, and select Goals.
- Add a shared goal and verify it appears for another signed-in group member.
- Restart the app and verify the goal persists in `group_goals`.
- Verify its creator or a group owner/admin can delete it.

### Google map, nearby places, and route

- Tap the Home map/search area to open Discovery.
- Verify a real map, recommendation markers, and live place cards appear.
- Change the Discovery filters and verify the request refreshes.
- Verify a route polyline and distance/duration badge appear when Google returns
  at least one destination.
- If the app says the Google key is missing or rejected, stop here and send the
  FastAPI error to Ramyl. Do not create an unrestricted personal production key.

### Saved places and voting

- Create a group first.
- In Discovery Preferences, choose a recommendation.
- In **Preferences – Choices**, select its group, date, and time.
- As an owner/admin, verify the Group Voting switch is visible. As a normal
  member, verify it is not shown and voting remains enabled.
- Tap **Add to Itinerary** and verify the app opens the Itinerary tab.
- Open the Discovery Itinerary tab and select the group.
- Verify the scheduled place appears at the selected day/time with a gray
  tracker while it is pending.
- Vote, verify the count changes, then remove the vote.
- Keep the same group open on a second signed-in device/session and verify vote
  and saved-place changes refresh through Realtime.
- When every current member votes, verify its tracker and card become orange.
- Restart the app and verify the schedule and confirmation state remain.
- In Studio, inspect `places`, `trip_places`, and `votes`.

### Shared itinerary finalization

- Save at least one place to a group; two to five places makes a clearer demo.
- Add votes and verify incomplete proposals remain gray.
- Open Discovery **Itinerary** and select the group.
- As the group owner/admin, tap **Finalize all scheduled places**.
- Verify every scheduled place becomes orange without changing the date/time
  selected in Preferences – Choices.
- Restart the app and verify the same itinerary loads from the database.
- In Studio, inspect `itineraries` and `itinerary_items`.
- Sign in as a normal member and verify the itinerary is visible but only an
  owner/admin can finalize it.
- Tap **Sync confirmed places to calendar**, choose a writable Google or device
  calendar, and verify only orange places were added. Gray proposals must never
  be exported.

### Profile and preferences

- Open the profile screen and verify the authenticated name/email appear.
- Edit Personal Info, restart the app, and verify the values persist.
- Change Travel Preferences, restart the app, and verify the selection persists.
- In Studio, verify `profiles` and `user_preferences` contain the same values.

## 10. How the frontend is expected to call the backend

The shared client is `frontend/lib/api.ts`. It obtains the current Supabase
session and sends this header automatically:

```http
Authorization: Bearer <signed-in-user-access-token>
```

Frontend code must not send the Supabase secret key or Google key. Do not call
Google Places or Routes directly from React Native; those calls belong in
FastAPI so keys, field masks, quotas, throttling, and error translation remain
server-controlled.

Before changing an endpoint, read `docs/api-contracts.md`. Coordinate the
change with Ramyl, update the Pydantic schema and endpoint tests, update the
contract document, and then update `frontend/lib/api.ts`.

## 11. Run automated checks before reporting a backend problem

Backend:

```powershell
cd apps\api
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

Frontend:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
```

Automated FastAPI tests mock external Google calls, so normal test runs should
not consume Google quota. Itinerary tests use only local deterministic logic.

## 12. Troubleshooting

### `failed to connect to the docker API` or Docker named-pipe errors

Docker Desktop is closed or its Linux engine is not ready. Start Docker Desktop,
wait for **Engine running**, verify `docker version` has a Server section, and
then run `npx supabase start` again. Do not run `wsl --shutdown` while Docker is
needed.

### Supabase reports stopped/unhealthy services

```powershell
npx supabase status
npx supabase stop
npx supabase start --debug
```

Send the final error block to Ramyl. The repository intentionally uses ports
`54420`-`54429` rather than the default `5432x` range because some Windows
systems reserve the default ports.

### `503` with `Supabase is not configured`

The root `.env` is missing, is in the wrong folder, has blank keys, or FastAPI
was started before the file changed. Fix `Travel-App-1\.env`, stop FastAPI with
Ctrl+C, and start it again.

### `401`, expired session, or invalid credentials

Confirm Supabase is running and `frontend/.env.local` uses the current local
publishable key. Create a local account on this computer. An account created on
another teammate's local Supabase instance does not exist here.

### Emulator cannot reach backend or Supabase

Confirm the frontend file uses `10.0.2.2`, not `localhost` or `127.0.0.1`.
Confirm FastAPI was started with `--host 0.0.0.0`. Restart Expo after changing
environment files:

```powershell
npx expo start --clear --android
```

### Google Places/Routes returns `502`, `403`, or key errors

Confirm the root `.env` has the current server key and restart FastAPI. In Google
Cloud, the same project must have billing, Places API (New), and Routes API
enabled. The key's API restrictions must include both APIs. Never remove key
restrictions as a permanent fix.

### Database tables exist but new migrations are missing

```powershell
npx supabase migration up
```

If Ramyl specifically asks for a clean rebuild, the following command deletes
all local users and local data, then recreates the schema:

```powershell
npx supabase db reset
```

Never run `db reset --linked` and never reset a hosted team database.

### Metro cache or app bundle appears stale

Stop Expo with Ctrl+C, then:

```powershell
cd frontend
npx expo start --clear --android
```

### A port is already in use

Do not edit shared port configuration immediately. Close old FastAPI/Expo
terminals, check Docker Desktop for a duplicate local Supabase project, and send
the port error to Ramyl if it remains.

## 13. Stop safely at the end of the day

1. In the Expo terminal, press Ctrl+C.
2. In the FastAPI terminal, press Ctrl+C.
3. From the repository root, stop Supabase while preserving local data:

```powershell
npx supabase stop
```

4. Quit Docker Desktop if it is no longer needed.
5. Optionally release WSL memory only after Docker and Supabase are stopped:

```powershell
wsl --shutdown
```

Do not use `npx supabase stop --no-backup` unless the local data is intentionally
being discarded.

## 14. What to send when reporting a problem

Send Ramyl:

- the current branch from `git branch --show-current`;
- the latest commit from `git log -1 --oneline`;
- the exact feature and last successful action;
- the full FastAPI error block;
- the relevant Expo/Metro error block;
- the HTTP status code if one appears;
- a screenshot with keys and access tokens hidden;
- whether `npx supabase status` and the health endpoint succeeded.

Never send `.env`, access tokens, Supabase secret keys, Google keys, or database
passwords in screenshots or group chat.

## Official setup references

- [Expo SDK 54 reference](https://docs.expo.dev/versions/v54.0.0/)
- [Expo Android Emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Android Emulator host networking](https://developer.android.com/studio/run/emulator-networking-address)
- [Supabase local development](https://supabase.com/docs/guides/local-development)
- [Supabase local workflow and migration commands](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [`uv` installation](https://docs.astral.sh/uv/getting-started/installation/)
