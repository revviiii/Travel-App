create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    avatar_url text,
    country text,
    phone_number text,
    gender text,
    preferred_language text not null default 'en',
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.user_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    preference_key text not null,
    created_at timestamptz not null default now(),
    unique (user_id, preference_key)
);

create table public.trips (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete restrict,
    name text not null check (char_length(name) between 1 and 120),
    destination_name text,
    destination_latitude double precision check (
        destination_latitude is null or destination_latitude between -90 and 90
    ),
    destination_longitude double precision check (
        destination_longitude is null or destination_longitude between -180 and 180
    ),
    start_date date,
    end_date date,
    budget numeric(12, 2) check (budget is null or budget >= 0),
    status text not null default 'planning' check (
        status in ('planning', 'active', 'completed', 'cancelled')
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.trip_members (
    trip_id uuid not null references public.trips (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    joined_at timestamptz not null default now(),
    primary key (trip_id, user_id)
);

create table public.trip_invitations (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips (id) on delete cascade,
    created_by uuid not null references public.profiles (id) on delete cascade,
    invite_token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
    expires_at timestamptz,
    maximum_uses integer check (maximum_uses is null or maximum_uses > 0),
    use_count integer not null default 0 check (use_count >= 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create index trip_members_user_id_idx on public.trip_members (user_id);
create index trip_invitations_trip_id_idx on public.trip_invitations (trip_id);
create index trips_owner_id_idx on public.trips (owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name')
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
