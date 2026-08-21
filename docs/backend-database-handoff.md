# Backend and database handoff

This is the completion and ownership record for Ramyl's agreed hackathon scope.
Use it with `full-stack-local-testing-guide.md` and `api-contracts.md`.

## Delivered responsibilities

- FastAPI project structure, configuration, CORS, health check, request IDs,
  request logging, Docker deployment configuration, and automated tests.
- Supabase Auth integration and authenticated profile/profile-preference APIs.
- PostgreSQL migrations, grants, constraints, indexes, triggers, and RLS for
  profiles, preferences, trips/groups, memberships, invitations, personal and
  group goals, saved places, votes, scheduled proposals, and itineraries.
- Atomic trip creation and invitation acceptance database functions.
- Group creation/list/detail/deletion, real member profiles/preferences, secure
  seven-day invitation links, and invitation acceptance in the app.
- Google Places API (New) and Routes API server clients with restricted field
  masks, normalized contracts, error translation, result-count limits, and
  per-user throttling.
- Real mobile map markers/routes, place scheduling, optional leader-controlled
  voting, unanimous confirmation, leader finalization, chronological itinerary,
  and confirmed-only calendar export.
- Supabase Realtime publication and mobile refresh behavior for saved places,
  votes, itinerary state, members, and group goals.
- Persisted personal goals, shared group goals, profile data, and travel
  preferences.
- Full local setup, testing, troubleshooting, deployment, Maps, and API contract
  documentation.

## Deliberate scope decisions

- The team removed OpenAI itinerary generation. The itinerary uses the group's
  selected dates/times, votes, and owner/admin finalization, so no OpenAI charge
  or key is required.
- Persistent Google Places/Routes response caching was not added because current
  Google policies restrict caching most provider content. Stable Place IDs are
  retained as identifiers; request throttling and Google Cloud quotas control
  accidental spend.
- The original idea document also proposed optional notifications, check-ins,
  achievements, photo memories, and a Strava-style trip recap. These are not in
  the agreed low-fi demo workflow and are stretch features, not unfinished
  backend defects.
- Social-login buttons and profile-photo selection remain frontend placeholders.
  Email/password Supabase Auth is the supported demo login path.

## What teammates must do after pulling

1. Follow `docs/full-stack-local-testing-guide.md` from the prerequisites
   section if the computer has never run the backend/database.
2. Start Docker Desktop, then run `npx supabase start` and
   `npx supabase migration up` from the repository root.
3. Create the ignored root `.env` and `frontend/.env.local` files from their
   examples. Never copy Ramyl's local Supabase keys between computers.
4. Run FastAPI from `apps/api` and Expo from `frontend` in separate Kiro
   terminals.
5. Create fresh local email/password accounts, because local Supabase users are
   not shared.
6. Run the complete end-to-end checklist with two accounts before the demo.

## Required automated checks

```powershell
cd apps\api
uv run ruff check .
uv run ruff format --check .
uv run pytest

cd ..\..\frontend
npx tsc --noEmit
npm run lint
```

Normal automated tests mock Google requests and do not consume Maps quota.

## Current validation note

All backend tests and frontend static checks pass in the development workspace.
The newest database migrations still need `npx supabase migration up` in Kiro
with Docker Desktop available; Codex's isolated shell could not access the
Windows Docker executable. That environment limitation does not replace the
required teammate migration smoke test.
