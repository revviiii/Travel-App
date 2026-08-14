# Travel App

A collaborative mobile travel planner for discovering places, voting with a
group, building itineraries, navigating between stops, and reviewing completed
trips.

## Team

- Leigh Dela Cruz - frontend, backend, and video demo
- Revinea Labiano - frontend, backend, and documentation
- Ramyl Salazar - backend, database, Google Places, and Google Routes

## Planned stack

- Mobile: React Native, Expo, TypeScript
- API: Python and FastAPI
- Data: Supabase PostgreSQL, Auth, Realtime, and Storage
- Maps: Google Places API (New) and Routes API
- AI: OpenAI API for optional itinerary assistance

## Repository layout

```text
apps/mobile/       React Native application (to be initialized by frontend)
apps/api/          FastAPI backend
supabase/          Versioned database migrations and seed data
docs/              Architecture and implementation guides
```

## Backend quick start

Prerequisites: Python 3.12+ and `uv`.

```powershell
cd apps/api
uv sync
uv run fastapi dev
```

Then open `http://127.0.0.1:8000/docs`. Run the tests with:

```powershell
uv run pytest
```

Copy `.env.example` to `.env` and fill in local values. Never commit `.env` or
real API keys.

## Documentation

- [Ramyl implementation roadmap](docs/ramyl-implementation-roadmap.md)
- [Backend architecture](docs/architecture.md)
