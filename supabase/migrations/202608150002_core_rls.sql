alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.trip_members
        where trip_id = target_trip_id
          and user_id = (select auth.uid())
    );
$$;

create or replace function public.is_trip_admin(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.trip_members
        where trip_id = target_trip_id
          and user_id = (select auth.uid())
          and role in ('owner', 'admin')
    );
$$;

create or replace function public.shares_trip_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.trip_members mine
        join public.trip_members theirs on theirs.trip_id = mine.trip_id
        where mine.user_id = (select auth.uid())
          and theirs.user_id = other_user_id
    );
$$;

create policy "profiles_select_self_or_trip_member"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or public.shares_trip_with(id));

create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "preferences_select_self_or_trip_member"
on public.user_preferences for select
to authenticated
using (user_id = (select auth.uid()) or public.shares_trip_with(user_id));

create policy "preferences_insert_self"
on public.user_preferences for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "preferences_delete_self"
on public.user_preferences for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "trips_select_members"
on public.trips for select
to authenticated
using (public.is_trip_member(id));

create policy "trips_insert_owner"
on public.trips for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "trips_update_admins"
on public.trips for update
to authenticated
using (public.is_trip_admin(id))
with check (public.is_trip_admin(id));

create policy "trips_delete_owner"
on public.trips for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "members_select_members"
on public.trip_members for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "members_insert_owner_or_admin"
on public.trip_members for insert
to authenticated
with check (
    public.is_trip_admin(trip_id)
    or (
        user_id = (select auth.uid())
        and role = 'owner'
        and exists (
            select 1
            from public.trips
            where public.trips.id = public.trip_members.trip_id
              and public.trips.owner_id = (select auth.uid())
        )
    )
);

create policy "members_update_admins"
on public.trip_members for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

create policy "members_delete_admin_or_self"
on public.trip_members for delete
to authenticated
using (public.is_trip_admin(trip_id) or user_id = (select auth.uid()));

create policy "invitations_select_admins"
on public.trip_invitations for select
to authenticated
using (public.is_trip_admin(trip_id));

create policy "invitations_insert_admins"
on public.trip_invitations for insert
to authenticated
with check (
    public.is_trip_admin(trip_id)
    and created_by = (select auth.uid())
);

create policy "invitations_update_admins"
on public.trip_invitations for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

create policy "invitations_delete_admins"
on public.trip_invitations for delete
to authenticated
using (public.is_trip_admin(trip_id));
