create table public.travel_tracks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null check (char_length(btrim(name)) between 1 and 80),
    started_at timestamptz not null,
    ended_at timestamptz not null,
    duration_seconds integer not null check (duration_seconds >= 0),
    distance_meters double precision not null check (distance_meters >= 0),
    path jsonb not null check (
        jsonb_typeof(path) = 'array'
        and jsonb_array_length(path) between 2 and 20000
    ),
    created_at timestamptz not null default now(),
    check (ended_at >= started_at)
);

create index travel_tracks_user_created_idx
on public.travel_tracks (user_id, created_at desc);

alter table public.travel_tracks enable row level security;

create policy "travel_tracks_select_self"
on public.travel_tracks for select
to authenticated
using (user_id = (select auth.uid()));

create policy "travel_tracks_insert_self"
on public.travel_tracks for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "travel_tracks_delete_self"
on public.travel_tracks for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.travel_tracks from anon, authenticated;
grant select, insert, delete on table public.travel_tracks to authenticated;
