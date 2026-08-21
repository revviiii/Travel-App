create table public.places (
    id uuid primary key default gen_random_uuid(),
    google_place_id text not null unique check (
        char_length(google_place_id) between 1 and 255
    ),
    name text not null check (char_length(btrim(name)) between 1 and 200),
    address text check (address is null or char_length(address) <= 500),
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    primary_type text check (
        primary_type is null or char_length(primary_type) <= 100
    ),
    rating numeric(2, 1) check (rating is null or rating between 0 and 5),
    google_data_refreshed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.trip_places (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips (id) on delete cascade,
    place_id uuid not null references public.places (id) on delete restrict,
    suggested_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (trip_id, place_id)
);

create table public.votes (
    trip_place_id uuid not null references public.trip_places (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (trip_place_id, user_id)
);

create index trip_places_trip_created_idx
on public.trip_places (trip_id, created_at desc);
create index votes_user_id_idx on public.votes (user_id);

create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

alter table public.places enable row level security;
alter table public.trip_places enable row level security;
alter table public.votes enable row level security;

create policy "places_select_trip_members"
on public.places for select
to authenticated
using (
    exists (
        select 1
        from public.trip_places
        where place_id = public.places.id
          and public.is_trip_member(trip_id)
    )
);

create policy "trip_places_select_members"
on public.trip_places for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "trip_places_delete_suggester_or_admin"
on public.trip_places for delete
to authenticated
using (
    suggested_by = (select auth.uid())
    or public.is_trip_admin(trip_id)
);

create policy "votes_select_members"
on public.votes for select
to authenticated
using (
    exists (
        select 1
        from public.trip_places
        where id = public.votes.trip_place_id
          and public.is_trip_member(trip_id)
    )
);

create policy "votes_insert_self_member"
on public.votes for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and exists (
        select 1
        from public.trip_places
        where id = public.votes.trip_place_id
          and public.is_trip_member(trip_id)
    )
);

create policy "votes_delete_self"
on public.votes for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.places, public.trip_places, public.votes
from anon, authenticated;
grant select on table public.places to authenticated;
grant select, delete on table public.trip_places to authenticated;
grant select, insert, delete on table public.votes to authenticated;

create or replace function public.save_trip_place(
    target_trip_id uuid,
    new_google_place_id text,
    new_name text,
    new_address text,
    new_latitude double precision,
    new_longitude double precision,
    new_primary_type text,
    new_rating numeric
)
returns public.trip_places
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    saved_place_id uuid;
    saved_trip_place public.trip_places;
begin
    if current_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    if not exists (
        select 1
        from public.trip_members
        where trip_id = target_trip_id
          and user_id = current_user_id
    ) then
        raise exception 'Only trip members can save places' using errcode = '42501';
    end if;

    insert into public.places (
        google_place_id,
        name,
        address,
        latitude,
        longitude,
        primary_type,
        rating,
        google_data_refreshed_at
    )
    values (
        btrim(new_google_place_id),
        btrim(new_name),
        nullif(btrim(new_address), ''),
        new_latitude,
        new_longitude,
        nullif(btrim(new_primary_type), ''),
        new_rating,
        now()
    )
    on conflict (google_place_id) do update
    set
        name = excluded.name,
        address = excluded.address,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        primary_type = excluded.primary_type,
        rating = excluded.rating,
        google_data_refreshed_at = now()
    returning id into saved_place_id;

    insert into public.trip_places (trip_id, place_id, suggested_by)
    values (target_trip_id, saved_place_id, current_user_id)
    on conflict (trip_id, place_id) do update
    set trip_id = excluded.trip_id
    returning * into saved_trip_place;

    return saved_trip_place;
end;
$$;

revoke all on function public.save_trip_place(
    uuid,
    text,
    text,
    text,
    double precision,
    double precision,
    text,
    numeric
) from public, anon;

grant execute on function public.save_trip_place(
    uuid,
    text,
    text,
    text,
    double precision,
    double precision,
    text,
    numeric
) to authenticated;
