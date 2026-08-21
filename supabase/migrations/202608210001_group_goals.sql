create table public.group_goals (
    id uuid primary key default gen_random_uuid(),
    trip_id uuid not null references public.trips (id) on delete cascade,
    created_by uuid not null references public.profiles (id) on delete cascade,
    goal_text text not null check (
        char_length(btrim(goal_text)) between 1 and 100
    ),
    created_at timestamptz not null default now()
);

create index group_goals_trip_created_idx
on public.group_goals (trip_id, created_at desc);

alter table public.group_goals enable row level security;

create policy "group_goals_select_members"
on public.group_goals for select
to authenticated
using (public.is_trip_member(trip_id));

create policy "group_goals_insert_members"
on public.group_goals for insert
to authenticated
with check (
    created_by = (select auth.uid())
    and public.is_trip_member(trip_id)
);

create policy "group_goals_delete_creator_or_admin"
on public.group_goals for delete
to authenticated
using (
    created_by = (select auth.uid())
    or public.is_trip_admin(trip_id)
);

revoke all on table public.group_goals from anon, authenticated;
grant select, insert, delete on table public.group_goals to authenticated;
