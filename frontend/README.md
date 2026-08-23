# Pinara mobile application

This directory contains the Expo SDK 54 / React Native client for Pinara.
Start with the repository-root [README](../README.md) for the project overview,
costs, configuration, testing, Kiro use, and third-party attribution.

## Run against local services

```powershell
npm ci
Copy-Item .env.example .env.local
npx expo start --android --clear
```

For an Android Emulator, use `10.0.2.2` for services running on the host. For a
physical phone, use the computer's Wi-Fi IPv4 address and keep both devices on
the same network. See the [phone testing guide](../docs/phone-testing-guide.md)
for complete hosted and local workflows.

## Static checks

```powershell
npx tsc --noEmit
npm run lint
```

Never commit `.env.local`, access tokens, or Google/Supabase secrets.
