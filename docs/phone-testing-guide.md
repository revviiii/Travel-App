# Test Pinara on a physical Android phone or iPhone

This guide starts from a powered-off computer and assumes the teammate only has
access to the GitHub repository. Pinara's shared Supabase database and Render API
are hosted, so phone testing does **not** require Docker, WSL, Supabase Local, or a
local FastAPI terminal. Only the Expo development server runs on the computer.

## 1. One-time setup

Install these on the computer:

- Git
- Node.js 20 LTS or newer
- Expo Go from Google Play (Android) or the App Store (iPhone)

Ask the project owner to add the teammate to the `ramylsalazars-team` Expo team.
For Google sign-in during testing, also add the teammate's Gmail address as a
Google OAuth test user. Email/password sign-in can be used without Google OAuth.

## 2. Get the latest application

Open Kiro, open a PowerShell terminal, and run:

```powershell
cd C:\path\to\Travel-App
git switch main
git pull --ff-only origin main
cd frontend
npm ci
```

Do not run `npm audit fix --force`; it can install versions that are incompatible
with the project's Expo SDK.

## 3. Download the shared preview configuration

Log in with an Expo account that belongs to the Pinara Expo team:

```powershell
npx eas-cli@latest login
npx eas-cli@latest env:pull preview --path .env.local
```

The resulting `frontend/.env.local` contains public client configuration and is
ignored by Git. Never commit it or paste its values into chat. Confirm that it
contains `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## 4. Start Pinara

Start the Expo server from `frontend`:

```powershell
npx expo start --tunnel --clear
```

The first tunnel run may ask to install `@expo/ngrok`; answer `Y`. Keep this
terminal open while testing. A QR code appears after Expo starts.

### Android phone

1. Open Expo Go.
2. Choose **Scan QR code** and scan the terminal QR code.
3. Allow location access when Pinara asks.

If an installable Android preview APK is available instead, download it from the
Expo build link. The preview APK is the best way to verify Pinara's final icon,
splash screen, Android Google map key, and OAuth redirect behavior.

### iPhone

1. Open the normal iPhone Camera app.
2. Scan the QR code and tap the Expo Go notification.
3. Allow Expo Go to open the project and grant location access when asked.

Expo Go is the free iPhone testing path. Use email/password for the most reliable
authentication test in Expo Go. A standalone iPhone build requires Apple signing
and normally an Apple Developer team; that cost is unrelated to removing Apple
login from Pinara.

## 5. Test checklist

1. Confirm the launch screen says **Pinara**, not a team member's name.
2. Create a new account or log in.
3. Confirm a new account must save at least one preference before Home opens.
4. Confirm only Google and email/password authentication are offered.
5. Grant location permission and confirm the Home map centers near the phone.
6. Type another city or country in the Home search box; wait briefly and confirm
   the preview map moves there. Press Search to see recommendations.
7. Confirm only the gear opens Settings; the avatar and greeting do not.
8. Test groups, voting, itinerary finalization, calendar sync, and My Tracks.

The free Render service may need up to about a minute to wake after inactivity.
Retry once before reporting a network failure.

## 6. Stop for the day

Press `Ctrl+C` in the Expo terminal. No database or backend process needs to be
stopped because the phone test used the hosted services.

## Troubleshooting

- **Phone cannot open the project:** keep `--tunnel`, disable a restrictive VPN,
  and allow Node.js through Windows Firewall.
- **Configuration missing:** repeat the EAS login and `env:pull` command.
- **Google says access denied:** add that exact Gmail address under Google Cloud
  OAuth consent screen test users, then wait a few minutes.
- **Map is blank in an APK:** verify that the APK was built after the Android Maps
  environment variable was configured; native key or splash changes require a
  new build.
- **Old UI still appears:** stop Expo and restart with
  `npx expo start --tunnel --clear`.
