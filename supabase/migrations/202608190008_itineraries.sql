create table public.itineraries (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null unique references public.trips (id) on delete cascade,
    created_by uuid not null references public.profiles (id) on delete cascade,
    title text not null check (char_length(btrim(title)) between 1 and 160),
    summary text not null check (char_length(btrim(summary)) between 1 and 1000),
    generation_method text not null check (
        char_length(btrim(generation_method)) between 1 and 100
    ),
    start_date date not null,
    end_date date not null check (end_date >= start_date),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.itinerary_items (
    id uuid primary key default gen_random_uuid(),
    itinerary_id uuid not null references public.itineraries (id) on delete cascade,
    trip_place_id uuid not null references public.trip_places (id) on delete cascade,
    day_number integer not null check (day_number between 1 and 7),
    position integer not null check (position between 1 and 100),
    start_time time not null,
    duration_minutes integer not null check (duration_minutes between 15 and 720),
    travel_time_from_previous_minutes integer not null default 0 check (
        travel_time_from_previous_minutes between 0 and 1440
    ),
    notes text not null default '' check (char_length(notes) <= 500),
    created_at timestamptz not null default now(),
    unique (itinerary_id, trip_place_id),
    unique (itinerary_id, day_number, position)
);

create index itinerary_items_schedule_idx
on public.itinerary_items (itinerary_id, day_number, position);

create trigger itineraries_set_updated_at
before update on public.itineraries
for each row execute function public.set_updated_at();

alter table public.itineraries enable row level security;
alter table public.itinerary_items enable row level security;

create policy "itineraries_select_members"
on public.itineraries for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "itinerary_items_select_members"
on public.itinerary_items for select
to authenticated
using (
    exists (
        select 1
        from public.itineraries
        where id = public.itinerary_items.itinerary_id
          and public.is_trip_member(trip_id)
    )
);

revoke all on table public.itineraries, public.itinerary_items
from anon, authenticated;
grant select on table public.itineraries, public.itinerary_items to authenticated;

create or replace function public.replace_trip_itinerary(
    target_trip_id uuid,
    new_title text,
    new_summary text,
    new_generation_method text,
    new_start_date date,
    new_end_date date,
    new_items jsonb
)
returns public.itineraries
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    saved_itinerary public.itineraries;
begin
    if current_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    if not public.is_trip_admin(target_trip_id) then
        raise exception 'Only trip owners and admins can finalize an itinerary'
            using errcode = '42501';
    end if;

    if jsonb_typeof(new_items) <> 'array' or jsonb_array_length(new_items) = 0 then
        raise exception 'At least one itinerary item is required' using errcode = '22023';
    end if;

    if exists (
        select 1
        from jsonb_to_recordset(new_items) as item(trip_place_id uuid)
        where not exists (
            select 1
            from public.trip_places
            where id = item.trip_place_id
              and trip_id = target_trip_id
        )
    ) then
        raise exception 'Every itinerary item must belong to the trip'
            using errcode = '22023';
    end if;

    delete from public.itineraries where trip_id = target_trip_id;

    insert into public.itineraries (
        trip_id,
        created_by,
        title,
        summary,
        generation_method,
        start_date,
        end_date
    )
    values (
        target_trip_id,
        current_user_id,
        btrim(new_title),
        btrim(new_summary),
        btrim(new_generation_method),
        new_start_date,
        new_end_date
    )
    returning * into saved_itinerary;

    insert into public.itinerary_items (
        itinerary_id,
        trip_place_id,
        day_number,
        position,
        start_time,
        duration_minutes,
        travel_time_from_previous_minutes,
        notes
    )
    select
        saved_itinerary.id,
        item.trip_place_id,
        item.day_number,
        item.position,
        item.start_time,
        item.duration_minutes,
        item.travel_time_from_previous_minutes,
        item.notes
    from jsonb_to_recordset(new_items) as item(
        trip_place_id uuid,
        day_number integer,
        position integer,
        start_time time,
        duration_minutes integer,
        travel_time_from_previous_minutes integer,
        notes text
    );

    return saved_itinerary;
end;
$$;

revoke all on function public.replace_trip_itinerary(
    uuid,
    text,
    text,
    text,
    date,
    date,
    jsonb
) from public, anon;

grant execute on function public.replace_trip_itinerary(
    uuid,
    text,
    text,
    text,
    date,
    date,
    jsonb
) to authenticated;
