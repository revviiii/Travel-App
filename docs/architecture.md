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
        -> Scheduled-proposal itinerary service (local business logic)
    <- Supabase Realtime (votes, pins, and itinerary changes)
```

Endpoint modules should only translate HTTP requests and responses. Business
rules belong in services, database access belongs in repositories, and external
HTTP calls belong in clients.

The mobile application may call Supabase Auth directly, but Google secret keys
must remain on the FastAPI server. Finalizing an itinerary does not call a paid
AI provider; FastAPI preserves the dates and times selected by members and
marks the scheduled proposals as confirmed. The mobile app exports confirmed
items directly to a user-selected device calendar.
