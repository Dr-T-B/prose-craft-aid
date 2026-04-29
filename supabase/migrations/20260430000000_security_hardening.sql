-- Security hardening
--
-- Closes the anon-write gap on timed_sessions, saved_essay_plans, and
-- reflection_entries; revokes is_owner from anon; hardens function
-- search_path; restricts admin RPCs.
--
-- All statements are idempotent.

-- 3.0 Revoke ALL anon access on private student-state tables.
-- These tables hold personal student data and must be inaccessible to anon
-- at the GRANT level, not just via RLS policy filtering.
revoke all on public.timed_sessions from anon;
revoke all on public.saved_essay_plans from anon;
revoke all on public.reflection_entries from anon;
revoke all on public.retrieval_sessions from anon;
revoke all on public.retrieval_items from anon;
revoke all on public.retrieval_responses from anon;
revoke all on public.paragraph_attempts from anon;
revoke all on public.student_quote_pair_mastery from anon;
revoke all on public.paragraph_attempt_quote_links from anon;

-- 3.1 timed_sessions
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'timed_sessions'
  loop
    execute format('drop policy if exists %I on public.timed_sessions', r.policyname);
  end loop;
end $$;

create policy "timed_sessions_authenticated_owner"
  on public.timed_sessions for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3.1 saved_essay_plans
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'saved_essay_plans'
  loop
    execute format('drop policy if exists %I on public.saved_essay_plans', r.policyname);
  end loop;
end $$;

create policy "saved_essay_plans_authenticated_owner"
  on public.saved_essay_plans for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3.1 reflection_entries
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reflection_entries'
  loop
    execute format('drop policy if exists %I on public.reflection_entries', r.policyname);
  end loop;
end $$;

create policy "reflection_entries_authenticated_owner"
  on public.reflection_entries for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3.2 Revoke is_owner from anon. has_role intentionally retained.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_owner'
  ) then
    execute 'revoke execute on function public.is_owner(uuid, text) from anon';
  end if;
end $$;

-- 3.3 Pin search_path on updated-at trigger functions
do $$
declare fn text;
begin
  for fn in
    select format('%I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'trigger_set_updated_at',
        'update_updated_at_column',
        'set_updated_at',
        'touch_updated_at'
      )
  loop
    execute format('alter function %s set search_path = public', fn);
  end loop;
end $$;

-- 3.4 process_retrieval_response: restrict to authenticated only if present
do $$
declare fn text;
begin
  for fn in
    select format('%I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'process_retrieval_response'
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;

-- 3.5 get_admin_user_list: restrict to service_role only
do $$
declare fn text;
begin
  for fn in
    select format('%I.%I(%s)', n.nspname, p.proname,
                  pg_get_function_identity_arguments(p.oid))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_admin_user_list'
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('revoke all on function %s from authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;
