-- Stub migrations for tables that exist in production but had no migration file.
-- These tables are referenced as nullable FKs from paragraph_attempts and
-- thesis-route pages. Columns are derived from TypeScript types and query usage.
-- All content tables grant authenticated read; admin role manages writes.

-- exam_questions
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  question_family text,
  exam_year integer,
  paper text,
  component text,
  source_text text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_questions enable row level security;

create policy "exam_questions_authenticated_select"
  on public.exam_questions for select to authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "exam_questions_admin_all"
  on public.exam_questions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- thesis_routes
create table if not exists public.thesis_routes (
  id uuid primary key default gen_random_uuid(),
  route_code text not null unique,
  theme_id text,
  theme_label text,
  route_title text not null,
  exam_question_family text,
  grade_level text check (grade_level in ('B','A','A*')),
  core_argument text,
  thesis_sentence text,
  conceptual_upgrade text,
  ao3_context_frame text,
  ao5_tension text,
  paragraph_sequence jsonb,
  recommended_quote_pairs text[],
  common_risk text,
  examiner_value text,
  route_status text default 'not_started'
    check (route_status in ('not_started','in_progress','secure')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.thesis_routes enable row level security;

create policy "thesis_routes_authenticated_select"
  on public.thesis_routes for select to authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "thesis_routes_admin_all"
  on public.thesis_routes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- paragraph_templates
create table if not exists public.paragraph_templates (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  template_body text,
  paragraph_function text,
  grade_level text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paragraph_templates enable row level security;

create policy "paragraph_templates_authenticated_select"
  on public.paragraph_templates for select to authenticated
  using (published = true or public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "paragraph_templates_admin_all"
  on public.paragraph_templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
