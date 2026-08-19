alter table public.trip_places
add column scheduled_date date,
add column scheduled_time time,
add column duration_minutes integer not null default 120 check (
    duration_minutes between 15 and 720
),
add column voting_enabled boolean not null default true,
add column leader_finalized_at timestamptz,
add column leader_finalized_by uuid references public.profiles (id) on delete set null;

update public.trip_places as trip_place
set
    scheduled_date = coalesce(trip.start_date, current_date),
    scheduled_time = time '09:00'
from public.trips as trip
where trip.id = trip_place.trip_id;

alter table public.trip_places
alter column scheduled_date set not null,
alter column scheduled_time set not null;

create index trip_places_trip_schedule_idx
on public.trip_places (trip_id, scheduled_date, scheduled_time, created_at);

alter table public.itinerary_items
drop constraint if exists itinerary_items_day_number_check;

alter table public.itinerary_items
add constraint itinerary_items_day_number_check check (day_number between 1 and 365);

drop function if exists public.save_trip_place(
    uuid,
    text,
    text,
    text,
    double precision,
    double precision,
    text,
    numeric
);

create function public.save_trip_place(
    target_trip_id uuid,
    new_google_place_id text,
    new_name text,
    new_address text,
    new_latitude double precision,
    new_longitude double precision,
    new_primary_type text,
    new_rating numeric,
    new_scheduled_date date,
    new_scheduled_time time,
    new_duration_minutes integer,
    new_voting_enabled boolean
)
returns public.trip_places
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    caller_is_admin boolean;
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

    caller_is_admin := public.is_trip_admin(target_trip_id);
    if not new_voting_enabled and not caller_is_admin then
        raise exception 'Only trip owners and admins can disable group voting'
            using errcode = '42501';
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

    insert into public.trip_places (
        trip_id,
        place_id,
        suggested_by,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        voting_enabled,
        leader_finalized_at,
        leader_finalized_by
    )
    values (
        target_trip_id,
        saved_place_id,
        current_user_id,
        new_scheduled_date,
        new_scheduled_time,
        new_duration_minutes,
        new_voting_enabled,
        case when not new_voting_enabled then now() else null end,
        case when not new_voting_enabled then current_user_id else null end
    )
    on conflict (trip_id, place_id) do update
    set
        scheduled_date = excluded.scheduled_date,
        scheduled_time = excluded.scheduled_time,
        duration_minutes = excluded.duration_minutes,
        voting_enabled = case
            when caller_is_admin then excluded.voting_enabled
            else public.trip_places.voting_enabled
        end,
        leader_finalized_at = case
            when caller_is_admin and not excluded.voting_enabled then now()
            else public.trip_places.leader_finalized_at
        end,
        leader_finalized_by = case
            when caller_is_admin and not excluded.voting_enabled then current_user_id
            else public.trip_places.leader_finalized_by
        end
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
    numeric,
    date,
    time,
    integer,
    boolean
) from public, anon;

grant execute on function public.save_trip_place(
    uuid,
    text,
    text,
    text,
    double precision,
    double precision,
    text,
    numeric,
    date,
    time,
    integer,
    boolean
) to authenticated;

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

    update public.trip_places
    set
        leader_finalized_at = now(),
        leader_finalized_by = current_user_id
    where trip_id = target_trip_id
      and id in (
          select item.trip_place_id
          from jsonb_to_recordset(new_items) as item(trip_place_id uuid)
      );

    return saved_itinerary;
end;
$$;
