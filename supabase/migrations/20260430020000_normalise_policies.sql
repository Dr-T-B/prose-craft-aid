-- Policy name normalisation
--
-- Production has drifted to short-form policy names (e.g. "Students insert
-- own attempts"). The migrations use the canonical long names. Drop any
-- legacy short-named policies so that future db push runs are idempotent.

begin;

-- paragraph_attempts: drop legacy short names (canonical names are recreated
-- by 20260429010000_fix_critical_rls_and_student_progress.sql).
drop policy if exists "Students insert own attempts"
  on public.paragraph_attempts;
drop policy if exists "Students read own attempts"
  on public.paragraph_attempts;
drop policy if exists "Students update own attempts"
  on public.paragraph_attempts;

-- student_quote_pair_mastery: same pattern
drop policy if exists "Students insert own mastery"
  on public.student_quote_pair_mastery;
drop policy if exists "Students read own mastery"
  on public.student_quote_pair_mastery;
drop policy if exists "Students update own mastery"
  on public.student_quote_pair_mastery;

commit;

-- paragraph_attempt_quote_links: ensure canonical SELECT and INSERT policies
-- exist if they were dropped at any point.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'paragraph_attempt_quote_links'
      and policyname = 'Students can read own paragraph quote links'
  ) then
    execute $POL$
      create policy "Students can read own paragraph quote links"
        on public.paragraph_attempt_quote_links for select
        to authenticated
        using (
          exists (
            select 1 from public.paragraph_attempts pa
            where pa.id = paragraph_attempt_id
              and pa.student_id = (select auth.uid())
          )
        )
    $POL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'paragraph_attempt_quote_links'
      and policyname = 'Students can insert own paragraph quote links'
  ) then
    execute $POL$
      create policy "Students can insert own paragraph quote links"
        on public.paragraph_attempt_quote_links for insert
        to authenticated
        with check (
          exists (
            select 1 from public.paragraph_attempts pa
            where pa.id = paragraph_attempt_id
              and pa.student_id = (select auth.uid())
          )
        )
    $POL$;
  end if;
end $$;
