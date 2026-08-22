create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        coalesce(
            nullif(new.raw_user_meta_data ->> 'full_name', ''),
            nullif(new.raw_user_meta_data ->> 'name', '')
        ),
        coalesce(
            nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
            nullif(new.raw_user_meta_data ->> 'picture', '')
        )
    )
    on conflict (id) do update
    set
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
    return new;
end;
$$;

update public.profiles as profile
set
    full_name = coalesce(
        profile.full_name,
        nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
        nullif(auth_user.raw_user_meta_data ->> 'name', '')
    ),
    avatar_url = coalesce(
        profile.avatar_url,
        nullif(auth_user.raw_user_meta_data ->> 'avatar_url', ''),
        nullif(auth_user.raw_user_meta_data ->> 'picture', '')
    )
from auth.users as auth_user
where profile.id = auth_user.id;
