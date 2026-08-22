# Complete guide: run Pinara on an Android phone or iPhone

This guide assumes the computer has just been turned on and no Pinara service is
running. It also assumes the teammate starts with only the GitHub repository.

There are two valid ways to test Pinara on a physical phone:

1. **Hosted testing (recommended):** the phone uses the shared Supabase database
   and Render backend. Start only Expo on the computer.
2. **Full local testing:** the computer runs Docker/Supabase, FastAPI, and Expo.
   Use this when testing backend code, migrations, or local database changes.

Do not mix the environment file from one method with the services from the
other. Most teammates should use Method 1.

## One-time setup for every teammate

Install these once:

- [Git for Windows](https://git-scm.com/download/win)
- [Node.js](https://nodejs.org/en/download) 20.19 or newer (Node 22 LTS is recommended)
- [Expo Go](https://expo.dev/go) on the Android phone or iPhone
- Kiro, with the repository folder opened

Verify Git, Node, and npm in a new Kiro PowerShell terminal:

```powershell
git --version
node --version
npm --version
```

The project owner must add the teammate to the `ramylsalazars-team` Expo team.
To test Google login, the teammate's exact Gmail address must also be listed as
a Google OAuth test user. Pinara no longer offers Apple login.

If the repository has not been downloaded yet:

```powershell
cd "$env:USERPROFILE\Downloads"
git clone https://github.com/revviiii/Travel-App.git Travel-App-1
cd Travel-App-1
```

If it already exists, open its `Travel-App-1` folder in Kiro.

---

# Method 1: test with the hosted database and backend

This is the normal phone-testing method. Supabase and Render run online, so do
**not** start Docker, WSL, local Supabase, or FastAPI.

## Every time the computer has just booted

### Step 1: pull the latest code

Open **Terminal > New Terminal** in Kiro. Run from the repository root:

```powershell
git status
git branch --show-current
git switch main
git pull --ff-only origin main
```

Expected result: the current branch is `main` and Git says it is up to date or
downloads teammate commits.

Stop and ask the owner of the files for help if `git status` shows changes you
do not recognize. Do not use `git reset --hard` and do not discard their work.

### Step 2: install/update frontend dependencies

```powershell
cd frontend
npm ci
```

Run `npm ci` after cloning and whenever `package-lock.json` changes. It is safe
to run at the beginning of every testing session. Do not run
`npm audit fix --force`; forced package upgrades can break Expo SDK 54.

### Step 3: download the shared hosted configuration

Still inside `frontend`, log in to the team's Expo account and pull the preview
environment:

```powershell
npx eas-cli@latest login
npx eas-cli@latest env:pull preview --path .env.local
```

If `.env.local` already exists, allow the command to overwrite it. This file is
ignored by Git. Never send it in chat or commit it.

It must define these public client variables:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Do not add a Supabase secret key or a Google server key to an
`EXPO_PUBLIC_...` variable.

### Step 4: check that the hosted backend is awake

Open the following URL in the computer browser:

```text
https://travel-app-api-661e.onrender.com/api/v1/health
```

Or run:

```powershell
Invoke-RestMethod https://travel-app-api-661e.onrender.com/api/v1/health
```

The free Render instance can take about a minute to wake. If the first request
times out, wait and retry once. The hosted Supabase database does not need a
separate start command.

### Step 5: start Expo

Use the same `frontend` terminal:

```powershell
npx expo start --tunnel --clear
```

If Expo asks to install `@expo/ngrok`, answer `Y`. Keep this terminal open. The
QR code disappears when this process is stopped.

Only **one terminal** remains running in Method 1: the Expo/Metro terminal.

### Step 6A: open on an Android phone

1. Connect the phone to the internet.
2. Open Expo Go.
3. Tap **Scan QR code** and scan the code in the Kiro terminal.
4. Allow notifications only if wanted.
5. When Pinara asks, allow location access while using the app.

### Step 6B: open on an iPhone

1. Connect the iPhone to the internet.
2. Open the normal Camera app.
3. Scan the Kiro terminal QR code.
4. Tap the Expo Go banner and allow it to open the project.
5. If iOS asks for Local Network or Location permission, allow it.

Use email/password in Expo Go. Expo Go cannot return securely to Pinara from a
Google OAuth flow because it does not own Pinara's custom `frontend://` scheme.
Test Google login in the installed Pinara preview build instead. Final native
branding, custom schemes, and Android Maps keys also require that preview build.

## Test an already-built Android APK instead

An Android tester can avoid Metro entirely by installing the latest preview APK:

```powershell
cd C:\path\to\Travel-App-1\frontend
npx eas-cli@latest login
npx eas-cli@latest build:run --platform android --latest
```

This method requires an Android phone connected with USB debugging or a running
Android emulator. The installed preview APK already contains the hosted
configuration. Do not start a database, backend, or Expo terminal for it.

---

# Method 2: run the full local database, backend, and frontend

Use this method only when the teammate needs to test local backend/database
changes. A physical phone and computer must be on the **same Wi-Fi network**.
Expo's tunnel can carry the JavaScript bundle, but it does not tunnel the local
database or FastAPI server.

## Additional one-time setup for local testing

Install:

- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)
  using the WSL 2 backend
- `uv` for Python: `winget install --id=astral-sh.uv -e`
- Python 3.12 through uv: `uv python install 3.12`

Restart Kiro after installation and verify:

```powershell
wsl --version
docker version
uv --version
```

`docker version` must show both Client and Server. If it only shows Client,
open Docker Desktop and wait for the engine to finish starting.

## Every full-local session after booting the computer

### Step 1: start Docker Desktop

Open Docker Desktop from the Windows Start menu. Wait until it reports that the
Docker engine is running. Do not run `npx supabase start` before Docker is ready.

### Step 2: pull `main` and install dependencies

In Kiro Terminal 1 at the repository root:

```powershell
git status
git switch main
git pull --ff-only origin main

cd apps\api
uv sync
cd ..\..

cd frontend
npm ci
cd ..
```

### Step 3: start the local Supabase database

In Terminal 1 at the repository root:

```powershell
npx supabase start
npx supabase migration up
npx supabase status
```

On the first run, answer `y` if `npx` asks to download the Supabase CLI. Docker
may download several images. Wait until all services are healthy.

Local service addresses are:

| Service | Address on the computer |
| --- | --- |
| Supabase API/Auth | `http://127.0.0.1:54421` |
| PostgreSQL | `127.0.0.1:54422` |
| Supabase Studio | `http://127.0.0.1:54423` |
| Mailpit | `http://127.0.0.1:54424` |

Open `http://127.0.0.1:54423` to inspect tables and Authentication users.
The local database is separate from the team's hosted database.

Copy the **Publishable key** and **Secret key** shown by
`npx supabase status`. Keep them private. The secret key is backend-only.

### Step 4: find the computer's Wi-Fi IPv4 address

Run:

```powershell
ipconfig
```

Under the active **Wireless LAN adapter Wi-Fi**, copy the IPv4 Address. It often
looks like `192.168.1.25` or `10.0.0.15`. In the examples below it is written as
`<PC-WIFI-IP>`.

Do not use these addresses on a physical phone:

- `127.0.0.1` or `localhost` means the phone itself.
- `10.0.2.2` works only inside an Android Emulator.

### Step 5: configure the local FastAPI environment

From the repository root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Open the root `.env` file in Kiro and enter the local keys:

```dotenv
APP_ENV=development
APP_NAME=Pinara API
API_V1_PREFIX=/api/v1

SUPABASE_URL=http://127.0.0.1:54421
SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
SUPABASE_SECRET_KEY=<local-secret-key>

GOOGLE_MAPS_API_KEY=<restricted-development-server-key>
GOOGLE_PLACES_REQUESTS_PER_MINUTE=12
GOOGLE_ROUTES_REQUESTS_PER_MINUTE=20

CORS_ORIGINS=http://localhost:8081
```

Ask the backend owner for the Google server key through a private channel.
Without it, accounts/groups/database features can work, but live Places and
Routes requests will fail. Never commit `.env`.

### Step 6: configure the phone to reach the local computer

Back up the hosted file if it exists, then create the phone-local file:

```powershell
if (Test-Path frontend\.env.local) {
  Copy-Item frontend\.env.local frontend\.env.hosted.local -Force
}
if (-not (Test-Path frontend\.env.local)) {
  Copy-Item frontend\.env.example frontend\.env.local
}
```

Open `frontend/.env.local` and replace `<PC-WIFI-IP>` and the publishable key:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://<PC-WIFI-IP>:54421
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
EXPO_PUBLIC_API_URL=http://<PC-WIFI-IP>:8000
GOOGLE_MAPS_ANDROID_API_KEY=
```

Example only:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.25:54421
EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
```

These `.env` files are Git-ignored. Never place the local secret key in the
frontend file.

### Step 7: start FastAPI in Terminal 2

Open a second Kiro terminal:

```powershell
cd C:\path\to\Travel-App-1\apps\api
uv run fastapi dev --host 0.0.0.0
```

Keep Terminal 2 open. Verify on the computer:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

Then open this on the phone's browser, replacing the address:

```text
http://<PC-WIFI-IP>:8000/api/v1/health
```

Do not continue until the phone can see the health response. If Windows asks
whether Python may communicate on private networks, allow **Private networks**.

Also test local Supabase from the phone browser:

```text
http://<PC-WIFI-IP>:54421/auth/v1/health
```

If the computer endpoints work but the phone endpoints do not, the problem is
Wi-Fi isolation or Windows Firewall—not React Native code.

### Step 8: start Expo in Terminal 3

Open a third Kiro terminal:

```powershell
cd C:\path\to\Travel-App-1\frontend
npx expo start --lan --clear
```

Keep Terminal 3 open and scan the QR code with Expo Go. If the phone cannot load
Metro over LAN, retry with:

```powershell
npx expo start --tunnel --clear
```

Even with `--tunnel`, the phone still needs Wi-Fi access to `<PC-WIFI-IP>` for
FastAPI and Supabase.

### Step 9: create a local account

Local Supabase does not contain the hosted users.

1. Open Pinara and choose **Sign Up**.
2. Enter a unique test email and a password of at least eight characters.
3. Save at least one preference.
4. Confirm the app reaches Home.
5. Open local Studio at `http://127.0.0.1:54423`.
6. Check **Authentication > Users** and **Table Editor > profiles**.

Email confirmation is disabled locally. Use email/password for local testing;
local Google OAuth is not configured by default.

## What should remain running

During a full local phone test:

| Component | Where it runs | Keep open? |
| --- | --- | --- |
| Docker Desktop | Windows | Yes |
| Local Supabase | Docker containers | Yes |
| FastAPI | Kiro Terminal 2 | Yes |
| Expo/Metro | Kiro Terminal 3 | Yes |

The `npx supabase start` command can return to the prompt; the containers keep
running in Docker.

---

# End-to-end phone test checklist

1. Launch title says **Pinara**, not Ramyl.
2. Location onboarding displays an illustration and requests permission.
3. Login offers Google and email/password, with no Apple option.
4. A new account must save preferences before reaching Home.
5. Home map centers near the permitted phone location.
6. Enter another city/country; the map preview moves and Discovery returns real
   recommendations with photos.
7. Only the gear opens Settings; the avatar/name do not.
8. Create a group, close/reopen Pinara, and confirm it persists.
9. Long-press an owned group and test rename, picture, and delete.
10. Save places, vote, finalize the itinerary, and sync only finalized places.
11. Open a place's Google Maps link.
12. Record and save a short My Tracks route after granting location permission.

When reporting a failure, include the current commit (`git log -1 --oneline`),
the exact screen/action, HTTP status, and relevant Metro/FastAPI error. Hide all
keys and access tokens.

---

# Stop everything safely

## Hosted Method 1

1. Press `Ctrl+C` in the Expo terminal.
2. Close Expo Go if desired.

There is no local database or backend to stop.

## Full local Method 2

1. Press `Ctrl+C` in the Expo terminal.
2. Press `Ctrl+C` in the FastAPI terminal.
3. From the repository root, preserve the local data and stop Supabase:

```powershell
npx supabase stop
```

4. Quit Docker Desktop if it is no longer needed.
5. Optionally release WSL memory after Docker is stopped:

```powershell
wsl --shutdown
```

Do not use `npx supabase stop --no-backup` unless the local test data is meant to
be discarded. Never run `npx supabase db reset --linked`; that could target a
hosted project.

## Return from local mode to hosted mode

Restore the hosted frontend configuration:

```powershell
Copy-Item frontend\.env.hosted.local frontend\.env.local -Force
```

Or download it again:

```powershell
cd frontend
npx eas-cli@latest env:pull preview --path .env.local
```

Restart Expo after any `.env.local` change.

---

# Common problems

## Docker or Supabase cannot start

Open Docker Desktop and wait for its engine. Then verify:

```powershell
docker version
npx supabase status
```

If Docker Desktop was stopped with WSL, restart Docker Desktop before retrying.

## Phone cannot reach local services

- Confirm phone and computer use the same Wi-Fi.
- Disable mobile data temporarily so the phone stays on Wi-Fi.
- Use the Wi-Fi IPv4 address, not `localhost` or `10.0.2.2`.
- Allow Node.js, Docker, and Python on Windows **Private networks**.
- Test the FastAPI health URL in the phone browser first.
- Guest Wi-Fi often blocks devices from communicating with each other; use a
  normal private Wi-Fi network or use Method 1.

## App still uses old configuration

Stop Expo, verify `frontend/.env.local`, then run:

```powershell
cd frontend
npx expo start --clear --tunnel
```

## Render is slow or returns a temporary error

Open the hosted health URL and give the free instance about a minute to wake.

## Google login denies one teammate

Add that exact Gmail address in Google Cloud Console under the OAuth consent
screen's test users. Wait several minutes and try again.

If Google finishes but Safari/Chrome opens `localhost`, the Supabase redirect
was not allow-listed and Supabase fell back to its Site URL. In the hosted
Supabase project, open **Authentication > URL Configuration** and set:

```text
Site URL: frontend://auth/callback
Redirect URL: frontend://auth/callback
Redirect URL: frontend://**
```

In Google Cloud, keep the authorized redirect URI set to Supabase's callback:

```text
https://<SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
```

Restart and test from the installed Pinara preview app—not Expo Go.

## Google Places or Routes fails locally

Confirm the backend root `.env` contains the restricted server key and restart
FastAPI. Places API (New), Routes API, billing, and quotas must be enabled in the
same Google Cloud project.

## Local schema is missing a new migration

Run from the repository root:

```powershell
npx supabase migration up
```

Only if the backend owner explicitly asks for a clean local rebuild:

```powershell
npx supabase db reset
```

This deletes local users/data. Never add `--linked`.

For deeper backend/database testing, see
[the full-stack local testing guide](full-stack-local-testing-guide.md).
