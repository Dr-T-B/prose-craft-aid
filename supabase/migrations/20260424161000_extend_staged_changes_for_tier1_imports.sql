-- Compatibility columns for Tier 1 library import staging.
-- Additive and idempotent: keeps the existing review queue, proposed_patch,
-- reviewed_at/status workflow, RLS policies, and live library tables intact.

alter table public.staged_changes
  add column if not exists operation text not null default 'update',
  add column if not exists normalized_payload jsonb not null default '{}'::jsonb,
  add column if not exists source_payload jsonb not null default '{}'::jsonb,
  add column if not exists validation_status text not null default 'pending',
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists applied_at timestamptz,
  add column if not exists source_row_number integer,
  add column if not exists import_log_id uuid references public.import_logs(id) on delete cascade,
  add column if not exists content_hash text,
  add column if not exists dedupe_key text;

-- If any compatibility columns already existed, normalize nulls/defaults so
-- future writes get the same guarantees as a fresh migration.
update public.staged_changes
set
  operation = coalesce(operation, 'update'),
  normalized_payload = coalesce(normalized_payload, '{}'::jsonb),
  source_payload = coalesce(source_payload, '{}'::jsonb),
  validation_status = coalesce(validation_status, 'pending'),
  validation_errors = coalesce(validation_errors, '[]'::jsonb);

alter table public.staged_changes
  alter column operation set default 'update',
  alter column operation set not null,
  alter column normalized_payload set default '{}'::jsonb,
  alter column normalized_payload set not null,
  alter column source_payload set default '{}'::jsonb,
  alter column source_payload set not null,
  alter column validation_status set default 'pending',
  alter column validation_status set not null,
  alter column validation_errors set default '[]'::jsonb,
  alter column validation_errors set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'staged_changes_operation_check'
      and conrelid = 'public.staged_changes'::regclass
  ) then
    if exists (
      select 1
      from public.staged_changes
      where operation not in ('insert', 'update', 'upsert', 'delete')
    ) then
      raise notice 'Skipping staged_changes_operation_check because incompatible operation values exist.';
    else
      alter table public.staged_changes
        add constraint staged_changes_operation_check
        check (operation in ('insert', 'update', 'upsert', 'delete'));
    end if;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'staged_changes_validation_status_check'
      and conrelid = 'public.staged_changes'::regclass
  ) then
    if exists (
      select 1
      from public.staged_changes
      where validation_status not in ('pending', 'valid', 'warning', 'invalid')
    ) then
      raise notice 'Skipping staged_changes_validation_status_check because incompatible validation_status values exist.';
    else
      alter table public.staged_changes
        add constraint staged_changes_validation_status_check
        check (validation_status in ('pending', 'valid', 'warning', 'invalid'));
    end if;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.staged_changes'::regclass
      and conname = 'staged_changes_import_log_id_fkey'
  ) then
    if exists (
      select 1
      from public.staged_changes sc
      where sc.import_log_id is not null
        and not exists (
          select 1
          from public.import_logs il
          where il.id = sc.import_log_id
        )
    ) then
      raise notice 'Skipping staged_changes_import_log_id_fkey because orphaned import_log_id values exist.';
    else
      alter table public.staged_changes
        add constraint staged_changes_import_log_id_fkey
        foreign key (import_log_id)
        references public.import_logs(id)
        on delete cascade;
    end if;
  end if;
end $$;

create index if not exists idx_staged_changes_import_log_id
  on public.staged_changes (import_log_id);

create index if not exists idx_staged_changes_content_hash
  on public.staged_changes (content_hash);

create index if not exists idx_staged_changes_dedupe_key
  on public.staged_changes (dedupe_key);

create index if not exists idx_staged_changes_validation_status
  on public.staged_changes (validation_status);

create index if not exists idx_staged_changes_operation
  on public.staged_changes (operation);

create index if not exists idx_staged_changes_source_row_number
  on public.staged_changes (source_row_number);
