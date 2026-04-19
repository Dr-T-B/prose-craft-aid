-- Prose Craft Aid
-- First-pass reconstructed core schema for a new Supabase project.
--
-- Important:
-- This is a reconstruction from the current application code and generated
-- TypeScript database types, not a byte-for-byte export of the inaccessible
-- original Supabase project.
--
-- Use this as the controlled starting point for a new backend you own.
-- Apply in a fresh Supabase project, then verify app flows before importing
-- any new Tier 1 Google Sheets datasets.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type public.app_role as enum ('admin', 'user');

-- Helper trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core content tables
-- ---------------------------------------------------------------------------

create table if not exists public.routes (
  id text primary key,
  name text not null,
  level_tag text not null,
  core_question text not null,
  hard_times_emphasis text not null,
  atonement_emphasis text not null,
  comparative_insight text not null,
  best_use text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  family text not null,
  level_tag text not null,
  stem text not null,
  likely_core_methods text[] not null default '{}',
  primary_route_id text not null references public.routes(id) on delete restrict,
  secondary_route_id text not null references public.routes(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_methods (
  id text primary key,
  source_text text not null,
  quote_text text not null,
  method text not null,
  effect_prompt text not null,
  meaning_prompt text not null,
  level_tag text not null,
  best_themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comparative_matrix (
  id text primary key,
  axis text not null,
  hard_times text not null,
  atonement text not null,
  divergence text not null,
  themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.theses (
  id text primary key,
  route_id text not null references public.routes(id) on delete restrict,
  theme_family text not null,
  level text not null,
  thesis_text text not null,
  paragraph_job_1_label text not null,
  paragraph_job_2_label text not null,
  paragraph_job_3_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paragraph_jobs (
  id text primary key,
  route_id text not null references public.routes(id) on delete restrict,
  question_family text not null,
  job_title text not null,
  text1_prompt text not null,
  text2_prompt text not null,
  divergence_prompt text not null,
  judgement_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_cards (
  id text primary key,
  source_text text not null,
  name text not null,
  one_line text not null,
  themes text[] not null default '{}',
  core_function text,
  structural_role text,
  complication text,
  comparative_link text,
  common_misreading text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.symbol_entries (
  id text primary key,
  source_text text not null,
  name text not null,
  one_line text not null,
  themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.theme_maps (
  id text primary key,
  family text not null,
  one_line text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ao5_tensions (
  id text primary key,
  focus text not null,
  dominant_reading text not null,
  alternative_reading text not null,
  safe_stem text not null,
  level_tag text not null,
  best_use text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auth/profile/role tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  school_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Persistence tables
-- ---------------------------------------------------------------------------

create table if not exists public.saved_essay_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  title text,
  family text,
  question_id text,
  route_id text,
  thesis_id text,
  thesis_level text,
  ao5_enabled boolean not null default true,
  selected_ao5_ids text[] not null default '{}',
  selected_quote_ids text[] not null default '{}',
  paragraph_job_ids text[] not null default '{}',
  paragraph_cards jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timed_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  plan_id uuid references public.saved_essay_plans(id) on delete set null,
  mode_id text not null,
  duration_minutes integer not null,
  response_text text not null default '',
  word_count integer not null default 0,
  completed boolean not null default false,
  expired boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reflection_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text,
  session_id uuid not null references public.timed_sessions(id) on delete cascade,
  checklist jsonb not null default '{}'::jsonb,
  first_failure_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dataset text not null default '',
  q text not null default '',
  "from" text not null default '',
  "to" text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staged_changes (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_record_id text not null,
  proposal_type text not null default 'normalization',
  status text not null default 'pending',
  changed_fields text[] not null default '{}',
  original_snapshot jsonb not null default '{}'::jsonb,
  proposed_patch jsonb not null default '{}'::jsonb,
  note text,
  source_finding_id text,
  source_issue_type text,
  source_surface text,
  apply_error text,
  proposed_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  proposed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  filename text,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb,
  imported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Optional learning/resource tables already represented in generated types
-- ---------------------------------------------------------------------------

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  title text not null,
  body text,
  estimated_minutes integer,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  description text,
  url text,
  resource_type text not null default 'link',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started',
  progress_pct integer not null default 0,
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_questions_family on public.questions(family);
create index if not exists idx_questions_primary_route_id on public.questions(primary_route_id);
create index if not exists idx_questions_secondary_route_id on public.questions(secondary_route_id);
create index if not exists idx_quote_methods_source_text on public.quote_methods(source_text);
create index if not exists idx_quote_methods_best_themes on public.quote_methods using gin(best_themes);
create index if not exists idx_comparative_matrix_themes on public.comparative_matrix using gin(themes);
create index if not exists idx_character_cards_source_text on public.character_cards(source_text);
create index if not exists idx_character_cards_themes on public.character_cards using gin(themes);
create index if not exists idx_symbol_entries_source_text on public.symbol_entries(source_text);
create index if not exists idx_symbol_entries_themes on public.symbol_entries using gin(themes);
create index if not exists idx_theses_route_id on public.theses(route_id);
create index if not exists idx_theses_theme_family on public.theses(theme_family);
create index if not exists idx_paragraph_jobs_route_id on public.paragraph_jobs(route_id);
create index if not exists idx_saved_essay_plans_user_id on public.saved_essay_plans(user_id);
create index if not exists idx_timed_sessions_user_id on public.timed_sessions(user_id);
create index if not exists idx_reflection_entries_user_id on public.reflection_entries(user_id);
create index if not exists idx_saved_views_user_id on public.saved_views(user_id);
create index if not exists idx_staged_changes_status on public.staged_changes(status);
create index if not exists idx_staged_changes_target on public.staged_changes(target_table, target_record_id);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- ---------------------------------------------------------------------------
-- Auth helper functions
-- ---------------------------------------------------------------------------

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

-- Auth-only ownership helper.
-- Important: this intentionally does NOT trust anonymous/device-id ownership.
create or replace function public.is_owner(row_user_id uuid, row_device_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and row_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_updated_at_routes on public.routes;
create trigger set_updated_at_routes before update on public.routes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_questions on public.questions;
create trigger set_updated_at_questions before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_quote_methods on public.quote_methods;
create trigger set_updated_at_quote_methods before update on public.quote_methods
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_comparative_matrix on public.comparative_matrix;
create trigger set_updated_at_comparative_matrix before update on public.comparative_matrix
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_theses on public.theses;
create trigger set_updated_at_theses before update on public.theses
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_paragraph_jobs on public.paragraph_jobs;
create trigger set_updated_at_paragraph_jobs before update on public.paragraph_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_character_cards on public.character_cards;
create trigger set_updated_at_character_cards before update on public.character_cards
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_symbol_entries on public.symbol_entries;
create trigger set_updated_at_symbol_entries before update on public.symbol_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_theme_maps on public.theme_maps;
create trigger set_updated_at_theme_maps before update on public.theme_maps
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_ao5_tensions on public.ao5_tensions;
create trigger set_updated_at_ao5_tensions before update on public.ao5_tensions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_saved_essay_plans on public.saved_essay_plans;
create trigger set_updated_at_saved_essay_plans before update on public.saved_essay_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_timed_sessions on public.timed_sessions;
create trigger set_updated_at_timed_sessions before update on public.timed_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_reflection_entries on public.reflection_entries;
create trigger set_updated_at_reflection_entries before update on public.reflection_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_saved_views on public.saved_views;
create trigger set_updated_at_saved_views before update on public.saved_views
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_staged_changes on public.staged_changes;
create trigger set_updated_at_staged_changes before update on public.staged_changes
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_modules on public.modules;
create trigger set_updated_at_modules before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_lessons on public.lessons;
create trigger set_updated_at_lessons before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_resources on public.resources;
create trigger set_updated_at_resources before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_lesson_progress on public.lesson_progress;
create trigger set_updated_at_lesson_progress before update on public.lesson_progress
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.routes enable row level security;
alter table public.questions enable row level security;
alter table public.quote_methods enable row level security;
alter table public.comparative_matrix enable row level security;
alter table public.theses enable row level security;
alter table public.paragraph_jobs enable row level security;
alter table public.character_cards enable row level security;
alter table public.symbol_entries enable row level security;
alter table public.theme_maps enable row level security;
alter table public.ao5_tensions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.saved_essay_plans enable row level security;
alter table public.timed_sessions enable row level security;
alter table public.reflection_entries enable row level security;
alter table public.saved_views enable row level security;
alter table public.staged_changes enable row level security;
alter table public.import_logs enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.resources enable row level security;
alter table public.lesson_progress enable row level security;

-- Public read on core content tables
create policy routes_read_all on public.routes
for select using (true);

create policy questions_read_all on public.questions
for select using (true);

create policy quote_methods_read_all on public.quote_methods
for select using (true);

create policy comparative_matrix_read_all on public.comparative_matrix
for select using (true);

create policy theses_read_all on public.theses
for select using (true);

create policy paragraph_jobs_read_all on public.paragraph_jobs
for select using (true);

create policy character_cards_read_all on public.character_cards
for select using (true);

create policy symbol_entries_read_all on public.symbol_entries
for select using (true);

create policy theme_maps_read_all on public.theme_maps
for select using (true);

create policy ao5_tensions_read_all on public.ao5_tensions
for select using (true);

create policy modules_read_all on public.modules
for select using (published = true);

create policy lessons_read_all on public.lessons
for select using (published = true);

create policy resources_read_all on public.resources
for select using (published = true);

-- Profiles: user can read/update own row; admins can read all
create policy profiles_select_own_or_admin on public.profiles
for select using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy profiles_insert_own on public.profiles
for insert with check (user_id = auth.uid());

create policy profiles_update_own_or_admin on public.profiles
for update using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
) with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

-- User roles: admins can manage; signed-in users can view own roles
create policy user_roles_select_own_or_admin on public.user_roles
for select using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy user_roles_admin_all on public.user_roles
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Saved essay plans: signed-in owner or admin only
create policy saved_essay_plans_select_owner_or_admin on public.saved_essay_plans
for select using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_essay_plans_insert_owner_or_admin on public.saved_essay_plans
for insert with check (
  (auth.uid() is not null and user_id = auth.uid())
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_essay_plans_update_owner_or_admin on public.saved_essay_plans
for update using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
) with check (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_essay_plans_delete_owner_or_admin on public.saved_essay_plans
for delete using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

-- Timed sessions: signed-in owner or admin only
create policy timed_sessions_select_owner_or_admin on public.timed_sessions
for select using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy timed_sessions_insert_owner_or_admin on public.timed_sessions
for insert with check (
  (auth.uid() is not null and user_id = auth.uid())
  or public.has_role(auth.uid(), 'admin')
);

create policy timed_sessions_update_owner_or_admin on public.timed_sessions
for update using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
) with check (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy timed_sessions_delete_owner_or_admin on public.timed_sessions
for delete using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

-- Reflection entries: signed-in owner via user_id or admin
create policy reflection_entries_select_owner_or_admin on public.reflection_entries
for select using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy reflection_entries_insert_owner_or_admin on public.reflection_entries
for insert with check (
  (auth.uid() is not null and user_id = auth.uid())
  or public.has_role(auth.uid(), 'admin')
);

create policy reflection_entries_update_owner_or_admin on public.reflection_entries
for update using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
) with check (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

create policy reflection_entries_delete_owner_or_admin on public.reflection_entries
for delete using (
  public.is_owner(user_id, device_id)
  or public.has_role(auth.uid(), 'admin')
);

-- Saved views: signed-in owner only, admin override allowed
create policy saved_views_select_owner_or_admin on public.saved_views
for select using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_views_insert_owner_or_admin on public.saved_views
for insert with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_views_update_owner_or_admin on public.saved_views
for update using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
) with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy saved_views_delete_owner_or_admin on public.saved_views
for delete using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

-- Staged changes and import logs: admin-only governance surface
create policy staged_changes_admin_all on public.staged_changes
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy import_logs_admin_all on public.import_logs
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Module authoring/admin areas: admin-only write, published read already above
create policy modules_admin_write on public.modules
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy lessons_admin_write on public.lessons
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy resources_admin_write on public.resources
for all using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy lesson_progress_owner_or_admin_select on public.lesson_progress
for select using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy lesson_progress_owner_or_admin_insert on public.lesson_progress
for insert with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy lesson_progress_owner_or_admin_update on public.lesson_progress
for update using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
) with check (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

create policy lesson_progress_owner_or_admin_delete on public.lesson_progress
for delete using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
);

commit;
