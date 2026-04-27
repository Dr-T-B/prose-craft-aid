-- Paragraph Builder persistence and quote-pair mastery tracking
-- Pearson Edexcel Component 2 Prose app

create table if not exists public.student_quote_pair_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quote_pair_id uuid not null references public.quote_pairs(id) on delete cascade,
  mastery_status text not null default 'unseen' check (
    mastery_status in ('unseen','recognised','understood','paragraph_ready','essay_ready','secure')
  ),
  confidence_score integer check (confidence_score between 1 and 5),
  last_practised_at timestamptz,
  used_in_plan_count integer not null default 0,
  used_in_paragraph_count integer not null default 0,
  used_in_essay_count integer not null default 0,
  ao2_secure boolean not null default false,
  ao3_secure boolean not null default false,
  ao4_secure boolean not null default false,
  ao5_secure boolean not null default false,
  needs_review boolean not null default true,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, quote_pair_id)
);

create table if not exists public.paragraph_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  exam_question_id uuid references public.exam_questions(id) on delete set null,
  thesis_route_id uuid references public.thesis_routes(id) on delete set null,
  quote_pair_id uuid references public.quote_pairs(id) on delete set null,
  paragraph_template_id uuid references public.paragraph_templates(id) on delete set null,
  paragraph_position integer,
  paragraph_function text,
  draft_status text not null default 'draft' check (draft_status in ('draft','complete','reviewed','rewritten')),
  topic_sentence text,
  hard_times_analysis text,
  atonement_analysis text,
  ao4_comparison text,
  ao3_context_integration text,
  ao5_evaluation text,
  final_paragraph text,
  ao1_self_score integer check (ao1_self_score between 1 and 5),
  ao2_self_score integer check (ao2_self_score between 1 and 5),
  ao3_self_score integer check (ao3_self_score between 1 and 5),
  ao4_self_score integer check (ao4_self_score between 1 and 5),
  ao5_self_score integer check (ao5_self_score between 1 and 5),
  feedback_summary text,
  improvement_target text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paragraph_attempt_quote_links (
  id uuid primary key default gen_random_uuid(),
  paragraph_attempt_id uuid not null references public.paragraph_attempts(id) on delete cascade,
  quote_pair_id uuid not null references public.quote_pairs(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary','secondary','extension')),
  created_at timestamptz not null default now(),
  unique (paragraph_attempt_id, quote_pair_id)
);

create index if not exists idx_paragraph_attempts_student_id on public.paragraph_attempts(student_id);
create index if not exists idx_paragraph_attempts_quote_pair_id on public.paragraph_attempts(quote_pair_id);
create index if not exists idx_mastery_student_id on public.student_quote_pair_mastery(student_id);
create index if not exists idx_mastery_quote_pair_id on public.student_quote_pair_mastery(quote_pair_id);

alter table public.student_quote_pair_mastery enable row level security;
alter table public.paragraph_attempts enable row level security;
alter table public.paragraph_attempt_quote_links enable row level security;

create policy "Students can read own quote pair mastery"
  on public.student_quote_pair_mastery for select
  using (auth.uid() = student_id);

create policy "Students can insert own quote pair mastery"
  on public.student_quote_pair_mastery for insert
  with check (auth.uid() = student_id);

create policy "Students can update own quote pair mastery"
  on public.student_quote_pair_mastery for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "Students can read own paragraph attempts"
  on public.paragraph_attempts for select
  using (auth.uid() = student_id);

create policy "Students can insert own paragraph attempts"
  on public.paragraph_attempts for insert
  with check (auth.uid() = student_id);

create policy "Students can update own paragraph attempts"
  on public.paragraph_attempts for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "Students can read own paragraph quote links"
  on public.paragraph_attempt_quote_links for select
  using (
    exists (
      select 1 from public.paragraph_attempts pa
      where pa.id = paragraph_attempt_id and pa.student_id = auth.uid()
    )
  );

create policy "Students can insert own paragraph quote links"
  on public.paragraph_attempt_quote_links for insert
  with check (
    exists (
      select 1 from public.paragraph_attempts pa
      where pa.id = paragraph_attempt_id and pa.student_id = auth.uid()
    )
  );

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_student_quote_pair_mastery_updated_at on public.student_quote_pair_mastery;
create trigger trg_student_quote_pair_mastery_updated_at
before update on public.student_quote_pair_mastery
for each row execute function public.touch_updated_at();

drop trigger if exists trg_paragraph_attempts_updated_at on public.paragraph_attempts;
create trigger trg_paragraph_attempts_updated_at
before update on public.paragraph_attempts
for each row execute function public.touch_updated_at();
