# Backend architecture

Ramyl owns the complete FastAPI backend, Supabase database schema and security,
and the server-side Google Places and Routes integrations. Frontend developers
consume the documented API contract and should coordinate contract changes with
Ramyl before changing request or response shapes.

```text
React Native app
    -> Supabase Auth (sign in and token refresh)
    -> FastAPI /api/v1 (business operations)
        -> Supabase PostgreSQL (data and RLS)
        -> Google Places API (real place discovery)
        -> Google Routes API (distance, duration, and route polyline)
        -> OpenAI API (optional itinerary assistance)
    <- Supabase Realtime (votes, pins, and itinerary changes)
```

Endpoint modules should only translate HTTP requests and responses. Business
rules belong in services, database access belongs in repositories, and external
HTTP calls belong in clients.

The mobile application may call Supabase Auth directly, but Google and OpenAI
secret keys must remain on the FastAPI server.
