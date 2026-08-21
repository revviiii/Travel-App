revoke all on table
    public.trips,
    public.trip_members,
    public.trip_invitations
from anon, authenticated;

grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.trip_members to authenticated;
grant select, insert, update, delete on table public.trip_invitations to authenticated;

revoke all on function public.is_trip_member(uuid) from public, anon;
revoke all on function public.is_trip_admin(uuid) from public, anon;
revoke all on function public.shares_trip_with(uuid) from public, anon;

grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.is_trip_admin(uuid) to authenticated;
grant execute on function public.shares_trip_with(uuid) to authenticated;
