-- Fix paragraph_attempts 403 RLS error.
--
-- Root cause: migration 20260429010000_fix_critical_rls_and_student_progress.sql
-- was marked as applied on production via `supabase migration repair`, which
-- only writes a row to supabase_migrations.schema_migrations — it does not
-- execute the SQL. Production therefore has RLS enabled on paragraph_attempts
-- and student_quote_pair_mastery but zero policies, so every authenticated
-- write returns 403.
--
-- This migration recreates the canonical authenticated-only policies on the
-- three affected tables, idempotently. Safe on fresh local resets (drops are
-- guarded) and safe on production (creates the missing policies).

-- paragraph_attempts ---------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'paragraph_attempts'
  loop
    execute format('drop policy if exists %I on public.paragraph_attempts', r.policyname);
  end loop;
end $$;

create policy "Students can read own paragraph attempts"
  on public.paragraph_attempts for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "Students can insert own paragraph attempts"
  on public.paragraph_attempts for insert
  to authenticated
  with check (student_id = (select auth.uid()));

create policy "Students can update own paragraph attempts"
  on public.paragraph_attempts for update
  to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

-- student_quote_pair_mastery -------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'student_quote_pair_mastery'
  loop
    execute format('drop policy if exists %I on public.student_quote_pair_mastery', r.policyname);
  end loop;
end $$;

create policy "Students can read own quote pair mastery"
  on public.student_quote_pair_mastery for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy "Students can insert own quote pair mastery"
  on public.student_quote_pair_mastery for insert
  to authenticated
  with check (student_id = (select auth.uid()));

create policy "Students can update own quote pair mastery"
  on public.student_quote_pair_mastery for update
  to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

-- paragraph_attempt_quote_links ---------------------------------------------
-- Production has both canonical (authenticated) and legacy (public) duplicates;
-- normalise to the canonical pair only.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'paragraph_attempt_quote_links'
  loop
    execute format('drop policy if exists %I on public.paragraph_attempt_quote_links', r.policyname);
  end loop;
end $$;

create policy "Students can read own paragraph quote links"
  on public.paragraph_attempt_quote_links for select
  to authenticated
  using (
    exists (
      select 1
      from public.paragraph_attempts pa
      where pa.id = paragraph_attempt_id
        and pa.student_id = (select auth.uid())
    )
  );

create policy "Students can insert own paragraph quote links"
  on public.paragraph_attempt_quote_links for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.paragraph_attempts pa
      where pa.id = paragraph_attempt_id
        and pa.student_id = (select auth.uid())
    )
  );
