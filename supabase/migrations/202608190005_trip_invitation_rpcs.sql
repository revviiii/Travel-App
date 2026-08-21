create or replace function public.create_trip_invitation(
    target_trip_id uuid,
    new_expires_at timestamptz default (now() + interval '7 days'),
    new_maximum_uses integer default 1
)
returns public.trip_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    created_invitation public.trip_invitations;
begin
    if current_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    if not exists (
        select 1
        from public.trip_members
        where trip_id = target_trip_id
          and user_id = current_user_id
          and role in ('owner', 'admin')
    ) then
        raise exception 'Only trip owners and admins can create invitations'
            using errcode = '42501';
    end if;

    if new_expires_at is not null and new_expires_at <= now() then
        raise exception 'Invitation expiry must be in the future';
    end if;

    if new_maximum_uses is not null and new_maximum_uses <= 0 then
        raise exception 'Invitation maximum uses must be positive';
    end if;

    insert into public.trip_invitations (
        trip_id,
        created_by,
        expires_at,
        maximum_uses
    )
    values (
        target_trip_id,
        current_user_id,
        new_expires_at,
        new_maximum_uses
    )
    returning * into created_invitation;

    return created_invitation;
end;
$$;

create or replace function public.accept_trip_invitation(target_token text)
returns public.trip_members
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := (select auth.uid());
    invitation public.trip_invitations;
    membership public.trip_members;
begin
    if current_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;

    select *
    into invitation
    from public.trip_invitations
    where invite_token = btrim(target_token)
    for update;

    if invitation.id is null then
        raise exception 'Invitation is invalid, expired, or no longer active';
    end if;

    select *
    into membership
    from public.trip_members
    where trip_id = invitation.trip_id
      and user_id = current_user_id;

    if membership.trip_id is not null then
        return membership;
    end if;

    if not invitation.is_active
       or (invitation.expires_at is not null and invitation.expires_at <= now())
       or (
           invitation.maximum_uses is not null
           and invitation.use_count >= invitation.maximum_uses
       ) then
        raise exception 'Invitation is invalid, expired, or no longer active';
    end if;

    insert into public.trip_members (trip_id, user_id, role)
    values (invitation.trip_id, current_user_id, 'member')
    returning * into membership;

    update public.trip_invitations
    set
        use_count = use_count + 1,
        is_active = case
            when maximum_uses is not null and use_count + 1 >= maximum_uses
                then false
            else is_active
        end
    where id = invitation.id;

    return membership;
end;
$$;

revoke all on function public.create_trip_invitation(uuid, timestamptz, integer)
from public, anon;
revoke all on function public.accept_trip_invitation(text) from public, anon;

grant execute on function public.create_trip_invitation(uuid, timestamptz, integer)
to authenticated;
grant execute on function public.accept_trip_invitation(text) to authenticated;
