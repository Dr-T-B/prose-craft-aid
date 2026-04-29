-- glossary_terms: production table without a prior migration file.
-- Used by the retrieval_due_today view in 20260428020000_add_retrieval_tables.sql.

create table if not exists public.glossary_terms (
  id text primary key,
  term text not null,
  definition text not null default '',
  source_text text,
  category text,
  level_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.glossary_terms enable row level security;

create policy "glossary_terms_authenticated_select"
  on public.glossary_terms for select to authenticated
  using (true);

create policy "glossary_terms_admin_all"
  on public.glossary_terms for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
