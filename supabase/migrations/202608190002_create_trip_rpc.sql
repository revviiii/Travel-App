create or replace function public.create_trip_with_owner(
    new_name text,
    new_destination_name text default null,
    new_destination_latitude double precision default null,
    new_destination_longitude double precision default null,
    new_start_date date default null,
    new_end_date date default null,
    new_budget numeric default null
)
returns public.trips
language plpgsql
security invoker
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    created_trip public.trips;
begin
    if current_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    insert into public.trips (
        owner_id,
        name,
        destination_name,
        destination_latitude,
        destination_longitude,
        start_date,
        end_date,
        budget
    )
    values (
        current_user_id,
        btrim(new_name),
        nullif(btrim(new_destination_name), ''),
        new_destination_latitude,
        new_destination_longitude,
        new_start_date,
        new_end_date,
        new_budget
    )
    returning * into created_trip;

    insert into public.trip_members (trip_id, user_id, role)
    values (created_trip.id, current_user_id, 'owner');

    return created_trip;
end;
$$;

revoke all on function public.create_trip_with_owner(
    text,
    text,
    double precision,
    double precision,
    date,
    date,
    numeric
) from public;

grant execute on function public.create_trip_with_owner(
    text,
    text,
    double precision,
    double precision,
    date,
    date,
    numeric
) to authenticated;
