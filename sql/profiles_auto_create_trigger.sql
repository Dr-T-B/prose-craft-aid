-- Prose Craft Aid
-- Auto-create a profile row when a new auth user is created.
--
-- Apply this after sql/core_current_schema.sql in the new Supabase project.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    display_name,
    avatar_url,
    bio,
    school_year
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    null,
    null,
    null
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
