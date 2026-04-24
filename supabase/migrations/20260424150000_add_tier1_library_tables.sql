-- Tier 1 canonical library tables.
-- Safe/idempotent: creates missing tables, indexes, triggers, and policies
-- without touching existing import_logs, staged_changes, runtime content tables,
-- admin UI, or edge functions.

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'update_updated_at_column'
      and p.pronargs = 0
  ) then
    execute $fn$
      create function public.update_updated_at_column()
      returns trigger
      language plpgsql
      set search_path = public
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$;
    $fn$;
  end if;
end $$;

create table if not exists public.library_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  source_text text not null,
  author text,
  character_name text,
  speaker text,
  chapter text,
  part text,
  location_ref text,
  theme_tags text[] not null default '{}',
  motif_tags text[] not null default '{}',
  method_tags text[] not null default '{}',
  context_tags text[] not null default '{}',
  ao_tags text[] not null default '{}',
  difficulty_level text,
  exam_relevance text,
  analysis text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  component text,
  paper text,
  section text,
  source_text text,
  paired_text text,
  theme_tags text[] not null default '{}',
  method_tags text[] not null default '{}',
  context_tags text[] not null default '{}',
  ao_tags text[] not null default '{}',
  mark_value integer,
  difficulty_level text,
  exam_series text,
  question_type text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_comparative_pairings (
  id uuid primary key default gen_random_uuid(),
  pairing_title text,
  source_text text,
  text_a text not null,
  text_b text not null,
  quote_a text,
  quote_b text,
  comparison_focus text not null,
  theme_tags text[] not null default '{}',
  method_links text[] not null default '{}',
  context_links text[] not null default '{}',
  ao_tags text[] not null default '{}',
  argument_summary text,
  exam_use text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_thesis_bank (
  id uuid primary key default gen_random_uuid(),
  thesis_text text not null,
  question_focus text,
  source_text text,
  paired_text text,
  theme_tags text[] not null default '{}',
  ao_tags text[] not null default '{}',
  grade_band text,
  argument_type text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_paragraph_frames (
  id uuid primary key default gen_random_uuid(),
  frame_title text,
  frame_text text not null,
  source_text text,
  opening_stem text,
  comparison_stem text,
  ao2_stem text,
  ao3_stem text,
  ao4_stem text,
  ao5_stem text,
  theme_tags text[] not null default '{}',
  ao_tags text[] not null default '{}',
  grade_band text,
  use_case text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_context_bank (
  id uuid primary key default gen_random_uuid(),
  context_title text,
  context_point text not null,
  source_text text,
  context_type text,
  theme_tags text[] not null default '{}',
  ao_tags text[] not null default '{}',
  linked_quote_refs text[] not null default '{}',
  exam_use text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text,
  source_dataset text,
  source_sheet text,
  source_row_number integer,
  import_log_id uuid references public.import_logs(id) on delete set null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'library_quotes',
    'library_questions',
    'library_comparative_pairings',
    'library_thesis_bank',
    'library_paragraph_frames',
    'library_context_bank'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()',
      t || '_set_updated_at',
      t
    );
  end loop;
end $$;

create index if not exists library_quotes_content_hash_idx on public.library_quotes (content_hash);
create index if not exists library_quotes_source_text_idx on public.library_quotes (source_text);
create index if not exists library_quotes_theme_tags_gin_idx on public.library_quotes using gin (theme_tags);
create index if not exists library_quotes_ao_tags_gin_idx on public.library_quotes using gin (ao_tags);
create index if not exists library_quotes_created_at_idx on public.library_quotes (created_at desc);
create index if not exists library_quotes_import_log_id_idx on public.library_quotes (import_log_id);
create index if not exists library_quotes_character_name_idx on public.library_quotes (character_name);
create index if not exists library_quotes_speaker_idx on public.library_quotes (speaker);
create unique index if not exists library_quotes_content_hash_uidx
  on public.library_quotes (content_hash)
  where content_hash is not null;

create index if not exists library_questions_content_hash_idx on public.library_questions (content_hash);
create index if not exists library_questions_source_text_idx on public.library_questions (source_text);
create index if not exists library_questions_theme_tags_gin_idx on public.library_questions using gin (theme_tags);
create index if not exists library_questions_ao_tags_gin_idx on public.library_questions using gin (ao_tags);
create index if not exists library_questions_created_at_idx on public.library_questions (created_at desc);
create index if not exists library_questions_import_log_id_idx on public.library_questions (import_log_id);
create index if not exists library_questions_component_idx on public.library_questions (component);
create index if not exists library_questions_paper_idx on public.library_questions (paper);
create index if not exists library_questions_exam_series_idx on public.library_questions (exam_series);
create unique index if not exists library_questions_content_hash_uidx
  on public.library_questions (content_hash)
  where content_hash is not null;

create index if not exists library_comparative_pairings_content_hash_idx on public.library_comparative_pairings (content_hash);
create index if not exists library_comparative_pairings_source_text_idx on public.library_comparative_pairings (source_text);
create index if not exists library_comparative_pairings_theme_tags_gin_idx on public.library_comparative_pairings using gin (theme_tags);
create index if not exists library_comparative_pairings_ao_tags_gin_idx on public.library_comparative_pairings using gin (ao_tags);
create index if not exists library_comparative_pairings_created_at_idx on public.library_comparative_pairings (created_at desc);
create index if not exists library_comparative_pairings_import_log_id_idx on public.library_comparative_pairings (import_log_id);
create index if not exists library_comparative_pairings_text_a_idx on public.library_comparative_pairings (text_a);
create index if not exists library_comparative_pairings_text_b_idx on public.library_comparative_pairings (text_b);
create unique index if not exists library_comparative_pairings_content_hash_uidx
  on public.library_comparative_pairings (content_hash)
  where content_hash is not null;

create index if not exists library_thesis_bank_content_hash_idx on public.library_thesis_bank (content_hash);
create index if not exists library_thesis_bank_source_text_idx on public.library_thesis_bank (source_text);
create index if not exists library_thesis_bank_theme_tags_gin_idx on public.library_thesis_bank using gin (theme_tags);
create index if not exists library_thesis_bank_ao_tags_gin_idx on public.library_thesis_bank using gin (ao_tags);
create index if not exists library_thesis_bank_created_at_idx on public.library_thesis_bank (created_at desc);
create index if not exists library_thesis_bank_import_log_id_idx on public.library_thesis_bank (import_log_id);
create index if not exists library_thesis_bank_grade_band_idx on public.library_thesis_bank (grade_band);
create unique index if not exists library_thesis_bank_content_hash_uidx
  on public.library_thesis_bank (content_hash)
  where content_hash is not null;

create index if not exists library_paragraph_frames_content_hash_idx on public.library_paragraph_frames (content_hash);
create index if not exists library_paragraph_frames_source_text_idx on public.library_paragraph_frames (source_text);
create index if not exists library_paragraph_frames_theme_tags_gin_idx on public.library_paragraph_frames using gin (theme_tags);
create index if not exists library_paragraph_frames_ao_tags_gin_idx on public.library_paragraph_frames using gin (ao_tags);
create index if not exists library_paragraph_frames_created_at_idx on public.library_paragraph_frames (created_at desc);
create index if not exists library_paragraph_frames_import_log_id_idx on public.library_paragraph_frames (import_log_id);
create index if not exists library_paragraph_frames_grade_band_idx on public.library_paragraph_frames (grade_band);
create index if not exists library_paragraph_frames_use_case_idx on public.library_paragraph_frames (use_case);
create unique index if not exists library_paragraph_frames_content_hash_uidx
  on public.library_paragraph_frames (content_hash)
  where content_hash is not null;

create index if not exists library_context_bank_content_hash_idx on public.library_context_bank (content_hash);
create index if not exists library_context_bank_source_text_idx on public.library_context_bank (source_text);
create index if not exists library_context_bank_theme_tags_gin_idx on public.library_context_bank using gin (theme_tags);
create index if not exists library_context_bank_ao_tags_gin_idx on public.library_context_bank using gin (ao_tags);
create index if not exists library_context_bank_created_at_idx on public.library_context_bank (created_at desc);
create index if not exists library_context_bank_import_log_id_idx on public.library_context_bank (import_log_id);
create index if not exists library_context_bank_context_type_idx on public.library_context_bank (context_type);
create unique index if not exists library_context_bank_content_hash_uidx
  on public.library_context_bank (content_hash)
  where content_hash is not null;

alter table public.library_quotes enable row level security;
alter table public.library_questions enable row level security;
alter table public.library_comparative_pairings enable row level security;
alter table public.library_thesis_bank enable row level security;
alter table public.library_paragraph_frames enable row level security;
alter table public.library_context_bank enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'library_quotes',
    'library_questions',
    'library_comparative_pairings',
    'library_thesis_bank',
    'library_paragraph_frames',
    'library_context_bank'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = 'Authenticated users can read ' || t
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        'Authenticated users can read ' || t,
        t
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = 'Admins can insert ' || t
    ) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''::public.app_role))',
        'Admins can insert ' || t,
        t
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = 'Admins can update ' || t
    ) then
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin''::public.app_role)) with check (public.has_role(auth.uid(), ''admin''::public.app_role))',
        'Admins can update ' || t,
        t
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = 'Admins can delete ' || t
    ) then
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''::public.app_role))',
        'Admins can delete ' || t,
        t
      );
    end if;
  end loop;
end $$;
