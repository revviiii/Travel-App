alter table public.user_preferences
add constraint user_preferences_key_format check (
    preference_key ~ '^[a-z0-9][a-z0-9_-]{0,49}$'
);

revoke all on table public.profiles, public.user_preferences from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.user_preferences to authenticated;

create or replace function public.replace_user_preferences(new_preference_keys text[])
returns table (preference_key text)
language plpgsql
security invoker
set search_path = ''
as $$
begin
    delete from public.user_preferences
    where user_id = (select auth.uid());

    return query
    insert into public.user_preferences (user_id, preference_key)
    select
        (select auth.uid()),
        normalized.preference_key
    from (
        select distinct lower(trim(input.value)) as preference_key
        from unnest(new_preference_keys) as input(value)
        where trim(input.value) <> ''
    ) as normalized
    order by normalized.preference_key
    returning public.user_preferences.preference_key;
end;
$$;

revoke all on function public.replace_user_preferences(text[]) from public, anon;
grant execute on function public.replace_user_preferences(text[]) to authenticated;
