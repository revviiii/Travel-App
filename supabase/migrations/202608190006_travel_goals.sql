create table public.travel_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    goal_text text not null check (
        char_length(btrim(goal_text)) between 1 and 100
    ),
    created_at timestamptz not null default now()
);

create index travel_goals_user_created_idx
on public.travel_goals (user_id, created_at desc);

alter table public.travel_goals enable row level security;

create policy "travel_goals_select_self"
on public.travel_goals for select
to authenticated
using (user_id = (select auth.uid()));

create policy "travel_goals_insert_self"
on public.travel_goals for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "travel_goals_delete_self"
on public.travel_goals for delete
to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.travel_goals from anon, authenticated;
grant select, insert, delete on table public.travel_goals to authenticated;
