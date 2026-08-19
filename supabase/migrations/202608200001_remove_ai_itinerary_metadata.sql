do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'itineraries'
          and column_name = 'model'
    ) and not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'itineraries'
          and column_name = 'generation_method'
    ) then
        alter table public.itineraries rename column model to generation_method;
    end if;
end;
$$;

drop function if exists public.replace_trip_itinerary(
    uuid,
    text,
    text,
    text,
    date,
    date,
    jsonb
);

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
