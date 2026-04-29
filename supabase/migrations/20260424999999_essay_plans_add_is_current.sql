alter table public.essay_plans
  add column if not exists is_current boolean not null default false;

create index if not exists essay_plans_user_is_current_idx
  on public.essay_plans (user_id, is_current)
  where is_current = true;
