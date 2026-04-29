-- Performance indexes
--
-- 1. Adds an index for every foreign key column on public.* tables that has no
--    leading-column index. This is the standard fix for unindexed FKs.
-- 2. Re-creates RLS policies on hot tables with (select auth.uid()) so the
--    planner caches the call rather than re-evaluating per row.
--
-- CREATE INDEX is non-CONCURRENT here because the Supabase CLI migration
-- runner wraps each migration in a transaction.

-- 4.1 Auto-index unindexed FKs (single-column FKs only; composite FKs are rare
--     in this schema and benefit from human-chosen index column ordering).
do $$
declare
  rec record;
  ix_name text;
begin
  for rec in
    select
      c.conrelid::regclass::text as table_name,
      a.attname as column_name,
      a.attnum as attnum,
      c.conrelid as relid
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    join pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and n.nspname = 'public'
      and array_length(c.conkey, 1) = 1
  loop
    -- Skip if an index already exists with this column as its leading key
    if exists (
      select 1
      from pg_index i
      where i.indrelid = rec.relid
        and i.indkey[0] = rec.attnum
    ) then
      continue;
    end if;

    ix_name := format('idx_%s_%s',
      replace(rec.table_name, 'public.', ''),
      rec.column_name);
    if length(ix_name) > 63 then
      ix_name := left(ix_name, 63);
    end if;

    execute format(
      'create index if not exists %I on %s (%I)',
      ix_name, rec.table_name, rec.column_name
    );
  end loop;
end $$;

-- 4.2 Cache auth.uid() in RLS policies on student-progress tables.
-- Tables: paragraph_attempts, student_quote_pair_mastery,
--         paragraph_attempt_quote_links.
-- The April 29 migration already creates these with (select auth.uid()),
-- so this block is a no-op against a freshly-reset database. It exists to
-- correct production rows where bare auth.uid() may still be present.

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  cmd_clause text;
  using_clause text;
  check_clause text;
begin
  for pol in
    select schemaname, tablename, policyname, cmd, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'paragraph_attempts',
        'student_quote_pair_mastery',
        'paragraph_attempt_quote_links',
        'quote_pairs',
        'thematic_axis_pairings'
      )
      and (
        qual like '%auth.uid()%' and qual not like '%(select auth.uid())%'
        or with_check like '%auth.uid()%' and with_check not like '%(select auth.uid())%'
      )
  loop
    new_qual := regexp_replace(coalesce(pol.qual, ''),
      'auth\.uid\(\)', '(select auth.uid())', 'g');
    new_check := regexp_replace(coalesce(pol.with_check, ''),
      'auth\.uid\(\)', '(select auth.uid())', 'g');

    cmd_clause := case upper(pol.cmd)
      when 'ALL' then 'for all'
      when 'SELECT' then 'for select'
      when 'INSERT' then 'for insert'
      when 'UPDATE' then 'for update'
      when 'DELETE' then 'for delete'
      else 'for ' || pol.cmd
    end;

    using_clause := case
      when coalesce(pol.qual, '') = '' then ''
      else format(' using (%s)', new_qual)
    end;

    check_clause := case
      when coalesce(pol.with_check, '') = '' then ''
      else format(' with check (%s)', new_check)
    end;

    execute format('drop policy if exists %I on public.%I',
      pol.policyname, pol.tablename);

    execute format(
      'create policy %I on public.%I %s to %s%s%s',
      pol.policyname,
      pol.tablename,
      cmd_clause,
      array_to_string(pol.roles, ', '),
      using_clause,
      check_clause
    );
  end loop;
end $$;

-- 4.3 thematic_axis_pairings: collapse duplicate authenticated SELECT policies
do $$
declare
  pairings_exists boolean;
  select_count integer;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'thematic_axis_pairings'
  ) into pairings_exists;

  if not pairings_exists then
    return;
  end if;

  select count(*) from pg_policies
  where schemaname = 'public'
    and tablename = 'thematic_axis_pairings'
    and cmd = 'SELECT'
    and 'authenticated' = any(roles)
  into select_count;

  if select_count > 1 then
    execute 'drop policy if exists "thematic_axis_pairings_read" on public.thematic_axis_pairings';
    execute 'drop policy if exists "thematic_axis_pairings_user_write" on public.thematic_axis_pairings';
    execute 'drop policy if exists thematic_axis_pairings_authenticated_select on public.thematic_axis_pairings';

    execute $POL$
      create policy thematic_axis_pairings_authenticated_select
        on public.thematic_axis_pairings for select
        to authenticated
        using (true)
    $POL$;
  end if;
end $$;
