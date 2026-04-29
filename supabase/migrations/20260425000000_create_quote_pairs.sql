-- quote_pairs: core comparative quote content table.
-- This table exists in production but was never given a migration file.
-- All columns are derived from the TypeScript QuotePairMini type and usage
-- throughout the codebase.

create table if not exists public.quote_pairs (
  id uuid primary key default gen_random_uuid(),
  quote_pair_code text not null unique,
  theme_label text not null,
  hard_times_quote text not null default '',
  atonement_quote text not null default '',
  hard_times_location text,
  atonement_location text,
  method_category text,
  hard_times_method text,
  atonement_method text,
  key_word_image_focus text,
  effect_on_meaning text,
  structural_function text,
  ao3_historical_context text,
  ao3_literary_context text,
  ao3_context_trigger_sentence text,
  ao4_comparison_type text,
  how_they_compare text,
  why_useful_in_essay text,
  student_action text,
  ao5_tension text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quote_pairs_quote_pair_code
  on public.quote_pairs (quote_pair_code);

create index if not exists idx_quote_pairs_theme_label
  on public.quote_pairs (theme_label);

alter table public.quote_pairs enable row level security;

-- Authenticated users can read all quote pairs (content table)
create policy "quote_pairs_authenticated_select"
  on public.quote_pairs for select
  to authenticated
  using (true);

-- Admins can manage quote pairs
create policy "quote_pairs_admin_all"
  on public.quote_pairs for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_quote_pairs_updated_at'
      and tgrelid = 'public.quote_pairs'::regclass
  ) then
    create trigger trg_quote_pairs_updated_at
      before update on public.quote_pairs
      for each row execute function public.update_updated_at_column();
  end if;
end $$;
