-- Publish collaborative group state so authorized members receive live updates.
-- RLS continues to control which rows each authenticated client may receive.

alter table public.trip_members replica identity full;
alter table public.trip_places replica identity full;
alter table public.votes replica identity full;
alter table public.itineraries replica identity full;
alter table public.itinerary_items replica identity full;
alter table public.group_goals replica identity full;

do $$
begin
    alter publication supabase_realtime add table public.trip_members;
exception when duplicate_object then
    null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.group_goals;
exception when duplicate_object then
    null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.trip_places;
exception when duplicate_object then
    null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.votes;
exception when duplicate_object then
    null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.itineraries;
exception when duplicate_object then
    null;
end $$;

do $$
begin
    alter publication supabase_realtime add table public.itinerary_items;
exception when duplicate_object then
    null;
end $$;
