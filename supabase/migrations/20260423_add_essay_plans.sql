create extension if not exists pgcrypto;

create table if not exists public.essay_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_plan_id text,
  question_id text,
  family text,
  route_id text,
  thesis_level text not null default 'strong',
  thesis_id text,
  selected_quote_ids jsonb not null default '[]'::jsonb,
  ao5_enabled boolean not null default false,
  selected_ao5_ids jsonb not null default '[]'::jsonb,
  notes text,
  paragraph_cards jsonb not null default '[]'::jsonb,
  builder_handoffs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint essay_plans_selected_quote_ids_is_array check (jsonb_typeof(selected_quote_ids) = 'array'),
  constraint essay_plans_selected_ao5_ids_is_array check (jsonb_typeof(selected_ao5_ids) = 'array'),
  constraint essay_plans_paragraph_cards_is_array check (jsonb_typeof(paragraph_cards) = 'array'),
  constraint essay_plans_builder_handoffs_is_array check (jsonb_typeof(builder_handoffs) = 'array'),
  constraint essay_plans_thesis_level_valid check (thesis_level in ('weak', 'secure', 'strong'))
);

create index if not exists essay_plans_user_updated_idx
  on public.essay_plans (user_id, updated_at desc);

create unique index if not exists essay_plans_user_client_plan_id_uidx
  on public.essay_plans (user_id, client_plan_id)
  where client_plan_id is not null;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists essay_plans_set_updated_at on public.essay_plans;
create trigger essay_plans_set_updated_at
before update on public.essay_plans
for each row execute function public.set_updated_at();

alter table public.essay_plans enable row level security;

drop policy if exists "Users can view their own essay plans" on public.essay_plans;
create policy "Users can view their own essay plans"
  on public.essay_plans for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own essay plans" on public.essay_plans;
create policy "Users can insert their own essay plans"
  on public.essay_plans for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own essay plans" on public.essay_plans;
create policy "Users can update their own essay plans"
  on public.essay_plans for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own essay plans" on public.essay_plans;
create policy "Users can delete their own essay plans"
  on public.essay_plans for delete using (auth.uid() = user_id);
