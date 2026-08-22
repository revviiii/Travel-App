alter table public.places
add column if not exists photo_name text check (
    photo_name is null or char_length(photo_name) <= 500
);

drop function if exists public.save_trip_place(
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
    new_photo_name text,
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
        photo_name,
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
        nullif(btrim(new_photo_name), ''),
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
        photo_name = coalesce(excluded.photo_name, public.places.photo_name),
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
    text,
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
    text,
    date,
    time,
    integer,
    boolean
) to authenticated;
