-- Retrieval (spaced-repetition) tables used by Stage 2 RetrievalDrill.
-- These tables already exist in the live database; this migration captures
-- their schema in the repo so future environments can reproduce it.
-- Idempotent: safe to apply against a database that already has them.

create table if not exists public.retrieval_items (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  item_type       text        not null,
  item_id         text        not null,
  ease_factor     numeric     not null default 2.50 check (ease_factor >= 1.30),
  interval_days   integer     not null default 1   check (interval_days >= 1),
  repetitions     integer     not null default 0   check (repetitions >= 0),
  next_review_at  timestamptz not null default now(),
  last_reviewed_at timestamptz,
  total_reviews   integer     not null default 0,
  correct_reviews integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint retrieval_items_item_type_check check (item_type = any (array[
    'quote','glossary','context','pairing','thesis',
    'ao5_tension','theme_reframe','conceptual_upgrade'
  ])),
  unique (user_id, item_type, item_id)
);

create index if not exists idx_ri_user_due   on public.retrieval_items (user_id, next_review_at);
create index if not exists idx_ri_item_type  on public.retrieval_items (item_type);

create table if not exists public.retrieval_sessions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users(id) on delete set null,
  device_id       text,
  session_type    text        not null default 'daily_mix' check (session_type = any (array[
    'daily_mix','quote_drill','glossary_drill','context_drill','pairing_drill','thesis_drill','custom'
  ])),
  total_items     integer     not null default 0,
  correct_items   integer     not null default 0,
  duration_seconds integer,
  completed       boolean     not null default false,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_rs_user_started on public.retrieval_sessions (user_id, started_at desc);

create table if not exists public.retrieval_responses (
  id                uuid        primary key default gen_random_uuid(),
  session_id        uuid        not null references public.retrieval_sessions(id) on delete cascade,
  user_id           uuid        references auth.users(id) on delete set null,
  retrieval_item_id uuid        references public.retrieval_items(id) on delete set null,
  item_type         text        not null,
  item_id           text        not null,
  quality           integer     not null check (quality >= 0 and quality <= 5),
  recalled_correctly boolean    not null,
  response_time_ms  integer,
  new_ease_factor   numeric,
  new_interval_days integer,
  new_repetitions   integer,
  created_at        timestamptz not null default now()
);

create index if not exists idx_rr_session            on public.retrieval_responses (session_id);
create index if not exists idx_rr_retrieval_item_id  on public.retrieval_responses (retrieval_item_id);
create index if not exists idx_rr_item               on public.retrieval_responses (item_type, item_id);
create index if not exists idx_rr_user_created       on public.retrieval_responses (user_id, created_at desc);

-- Row-level security: each user sees only their own rows.
alter table public.retrieval_items     enable row level security;
alter table public.retrieval_sessions  enable row level security;
alter table public.retrieval_responses enable row level security;

drop policy if exists retrieval_items_owner_all     on public.retrieval_items;
drop policy if exists retrieval_sessions_owner_all  on public.retrieval_sessions;
drop policy if exists retrieval_responses_owner_all on public.retrieval_responses;

create policy retrieval_items_owner_all on public.retrieval_items
  for all
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sessions allow either an authed user OR an anonymous device-scoped session.
create policy retrieval_sessions_owner_all on public.retrieval_sessions
  for all
  using      (user_id = (select auth.uid()) or (user_id is null and device_id is not null))
  with check (user_id = (select auth.uid()) or (user_id is null and device_id is not null));

create policy retrieval_responses_owner_all on public.retrieval_responses
  for all
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Convenience view: items whose next_review_at has passed, with a label
-- pulled from whichever content table the item points at.
create or replace view public.retrieval_due_today as
  select
    ri.id              as retrieval_item_id,
    ri.user_id,
    ri.item_type,
    ri.item_id,
    ri.ease_factor,
    ri.interval_days,
    ri.repetitions,
    ri.next_review_at,
    ri.last_reviewed_at,
    ri.total_reviews,
    ri.correct_reviews,
    round(case when ri.total_reviews = 0 then 0::numeric
               else ri.correct_reviews::numeric / ri.total_reviews::numeric * 100::numeric end) as accuracy_pct,
    coalesce(qm.quote_text, gt.term, lcb.context_point, cm.axis, th.thesis_text, ao5.focus) as item_label,
    coalesce(qm.source_text, gt.source_text, lcb.source_text, cm.axis, null::text) as source_text,
    coalesce(gt.category, lcb.context_type) as item_category
  from public.retrieval_items ri
    left join public.quote_methods       qm  on ri.item_type = 'quote'       and ri.item_id = qm.id
    left join public.glossary_terms      gt  on ri.item_type = 'glossary'    and ri.item_id = gt.id
    left join public.library_context_bank lcb on ri.item_type = 'context'    and ri.item_id = lcb.id::text
    left join public.comparative_matrix  cm  on ri.item_type = 'pairing'     and ri.item_id = cm.id
    left join public.theses              th  on ri.item_type = 'thesis'      and ri.item_id = th.id
    left join public.ao5_tensions        ao5 on ri.item_type = 'ao5_tension' and ri.item_id = ao5.id
  where ri.next_review_at <= now();
