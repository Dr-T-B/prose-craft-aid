-- Critical RLS and student-progress repair.
--
-- Production note: take a backup and check existing student_id values before
-- applying. The updates below translate rows that still point at profiles.id to
-- auth.users.id; any remaining orphaned student_id values should be investigated
-- before the new foreign keys are added.

-- Policies across the app call has_role(), so anon/authenticated roles must be
-- allowed to execute the helper. The helper itself remains SECURITY DEFINER and
-- only returns whether the supplied user has the supplied role.
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

-- Canonicalise student progress ownership to auth.users(id), matching the
-- frontend and existing RLS checks that compare student_id to auth.uid().
update public.student_quote_pair_mastery m
set student_id = p.user_id
from public.profiles p
where m.student_id = p.id;

update public.paragraph_attempts pa
set student_id = p.user_id
from public.profiles p
where pa.student_id = p.id;

do $$
declare
  fk_name text;
begin
  for fk_name in
    select conname
    from pg_constraint
    where conrelid = 'public.student_quote_pair_mastery'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like 'FOREIGN KEY (student_id)%'
  loop
    execute format('alter table public.student_quote_pair_mastery drop constraint %I', fk_name);
  end loop;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.student_quote_pair_mastery'::regclass
      and conname = 'student_quote_pair_mastery_student_id_fkey'
  ) then
    alter table public.student_quote_pair_mastery
      add constraint student_quote_pair_mastery_student_id_fkey
      foreign key (student_id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
declare
  fk_name text;
begin
  for fk_name in
    select conname
    from pg_constraint
    where conrelid = 'public.paragraph_attempts'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like 'FOREIGN KEY (student_id)%'
  loop
    execute format('alter table public.paragraph_attempts drop constraint %I', fk_name);
  end loop;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.paragraph_attempts'::regclass
      and conname = 'paragraph_attempts_student_id_fkey'
  ) then
    alter table public.paragraph_attempts
      add constraint paragraph_attempts_student_id_fkey
      foreign key (student_id) references auth.users(id) on delete cascade;
  end if;
end $$;

drop policy if exists "Students can read own quote pair mastery" on public.student_quote_pair_mastery;
drop policy if exists "Students can insert own quote pair mastery" on public.student_quote_pair_mastery;
drop policy if exists "Students can update own quote pair mastery" on public.student_quote_pair_mastery;

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

drop policy if exists "Students can read own paragraph attempts" on public.paragraph_attempts;
drop policy if exists "Students can insert own paragraph attempts" on public.paragraph_attempts;
drop policy if exists "Students can update own paragraph attempts" on public.paragraph_attempts;

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

drop policy if exists "Students can read own paragraph quote links" on public.paragraph_attempt_quote_links;
drop policy if exists "Students can insert own paragraph quote links" on public.paragraph_attempt_quote_links;

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

-- Harden dashboard recommendation RPC so it can only be used by the logged-in
-- student for their own progress.
create or replace function public.get_next_best_action(target_student_id uuid)
returns table (
  action_type text,
  priority integer,
  quote_pair_id uuid,
  quote_pair_code text,
  theme_label text,
  title text,
  reason text,
  action_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if target_student_id is null or target_student_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with candidates as (
    select
      'build_paragraph'::text as action_type,
      100::integer as priority,
      qp.id as quote_pair_id,
      qp.quote_pair_code,
      qp.theme_label,
      'Build your first comparative paragraph for ' || qp.quote_pair_code as title,
      'This quote pair is recognised or available, but it has not yet been used in a paragraph.' as reason,
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code as action_url
    from public.quote_pairs qp
    left join public.student_quote_pair_mastery m
      on m.quote_pair_id = qp.id and m.student_id = target_student_id
    where coalesce(m.used_in_paragraph_count, 0) = 0

    union all

    select
      'ao4_drill'::text,
      90::integer,
      qp.id,
      qp.quote_pair_code,
      qp.theme_label,
      'Practise AO4 comparison for ' || qp.quote_pair_code,
      'This quote pair has been practised, but AO4 is not yet marked secure.',
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code
    from public.student_quote_pair_mastery m
    join public.quote_pairs qp on qp.id = m.quote_pair_id
    where m.student_id = target_student_id
      and m.used_in_paragraph_count > 0
      and coalesce(m.ao4_secure, false) = false

    union all

    select
      'review'::text,
      70::integer,
      qp.id,
      qp.quote_pair_code,
      qp.theme_label,
      'Review ' || qp.quote_pair_code,
      'This quote pair has not been practised recently.',
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code
    from public.student_quote_pair_mastery m
    join public.quote_pairs qp on qp.id = m.quote_pair_id
    where m.student_id = target_student_id
      and m.last_practised_at < now() - interval '14 days'
  )
  select
    c.action_type,
    c.priority,
    c.quote_pair_id,
    c.quote_pair_code,
    c.theme_label,
    c.title,
    c.reason,
    c.action_url
  from candidates c
  order by c.priority desc, c.quote_pair_code asc
  limit 1;
end;
$$;

revoke all on function public.get_next_best_action(uuid) from public;
revoke all on function public.get_next_best_action(uuid) from anon;
grant execute on function public.get_next_best_action(uuid) to authenticated;

-- Retrieval data is private student activity. Do not permit anonymous access
-- based on device_id alone.
drop policy if exists retrieval_items_owner_all on public.retrieval_items;
drop policy if exists retrieval_sessions_owner_all on public.retrieval_sessions;
drop policy if exists retrieval_responses_owner_all on public.retrieval_responses;
drop policy if exists retrieval_sessions_select_own on public.retrieval_sessions;
drop policy if exists retrieval_sessions_insert_own on public.retrieval_sessions;
drop policy if exists retrieval_sessions_update_own on public.retrieval_sessions;

create policy retrieval_items_owner_all
  on public.retrieval_items for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy retrieval_sessions_select_own
  on public.retrieval_sessions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy retrieval_sessions_insert_own
  on public.retrieval_sessions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy retrieval_sessions_update_own
  on public.retrieval_sessions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy retrieval_responses_owner_all
  on public.retrieval_responses for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.retrieval_sessions rs
      where rs.id = session_id
        and rs.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.retrieval_sessions rs
      where rs.id = session_id
        and rs.user_id = (select auth.uid())
    )
  );
