-- Migration: add essay_plans table
-- Recreated from live schema; includes fixed RLS policies ((select auth.uid()))
-- and pinned search_path on set_updated_at trigger function.

-- Trigger function (search_path pinned to prevent injection)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Table
create table if not exists public.essay_plans (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  client_plan_id      text,
  question_id         text,
  family              text,
  route_id            text,
  thesis_level        text not null default 'strong',
  thesis_id           text,
  selected_quote_ids  jsonb not null default '[]',
  ao5_enabled         boolean not null default false,
  selected_ao5_ids    jsonb not null default '[]',
  notes               text,
  paragraph_cards     jsonb not null default '[]',
  builder_handoffs    jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint essay_plans_thesis_level_valid
    check (thesis_level in ('weak', 'secure', 'strong')),
  constraint essay_plans_selected_quote_ids_is_array
    check (jsonb_typeof(selected_quote_ids) = 'array'),
  constraint essay_plans_selected_ao5_ids_is_array
    check (jsonb_typeof(selected_ao5_ids) = 'array'),
  constraint essay_plans_paragraph_cards_is_array
    check (jsonb_typeof(paragraph_cards) = 'array'),
  constraint essay_plans_builder_handoffs_is_array
    check (jsonb_typeof(builder_handoffs) = 'array')
);

-- Indexes
create index if not exists essay_plans_user_updated_idx
  on public.essay_plans (user_id, updated_at desc);

create unique index if not exists essay_plans_user_client_plan_id_uidx
  on public.essay_plans (user_id, client_plan_id)
  where client_plan_id is not null;

-- Trigger
create trigger essay_plans_set_updated_at
  before update on public.essay_plans
  for each row execute function public.set_updated_at();

-- RLS
alter table public.essay_plans enable row level security;

create policy "Users can view their own essay plans"
  on public.essay_plans for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own essay plans"
  on public.essay_plans for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own essay plans"
  on public.essay_plans for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own essay plans"
  on public.essay_plans for delete
  using ((select auth.uid()) = user_id);
