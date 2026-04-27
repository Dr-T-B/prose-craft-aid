-- Dashboard + Next Best Action system
-- Depends on student_quote_pair_mastery and paragraph_attempts.

create or replace view public.v_student_quote_pair_progress as
select
  m.student_id,
  m.quote_pair_id,
  qp.quote_pair_code,
  qp.theme_label,
  qp.hard_times_quote,
  qp.atonement_quote,
  qp.student_action,
  qp.why_useful_in_essay,
  m.mastery_status,
  m.confidence_score,
  m.used_in_plan_count,
  m.used_in_paragraph_count,
  m.used_in_essay_count,
  m.ao2_secure,
  m.ao3_secure,
  m.ao4_secure,
  m.ao5_secure,
  m.needs_review,
  m.last_practised_at,
  m.updated_at
from public.student_quote_pair_mastery m
join public.quote_pairs qp on qp.id = m.quote_pair_id;

create or replace view public.v_student_recent_paragraphs as
select
  pa.id,
  pa.student_id,
  pa.quote_pair_id,
  qp.quote_pair_code,
  qp.theme_label,
  pa.final_paragraph,
  pa.draft_status,
  pa.ao1_self_score,
  pa.ao2_self_score,
  pa.ao3_self_score,
  pa.ao4_self_score,
  pa.ao5_self_score,
  pa.improvement_target,
  pa.created_at
from public.paragraph_attempts pa
left join public.quote_pairs qp on qp.id = pa.quote_pair_id;

create or replace function public.get_next_best_action(target_student_id uuid)
returns table (
  action_type text,
  priority integer,
  quote_pair_id uuid,
  quote_pair_code text,
  theme_label text,
  title text,
  reason text,
  action_url text
)
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select
      'build_paragraph'::text as action_type,
      100 as priority,
      qp.id as quote_pair_id,
      qp.quote_pair_code,
      qp.theme_label,
      'Build your first comparative paragraph for ' || qp.quote_pair_code as title,
      'This quote pair is recognised or available, but it has not yet been used in a paragraph.' as reason,
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code as action_url
    from public.quote_pairs qp
    left join public.student_quote_pair_mastery m
      on m.quote_pair_id = qp.id and m.student_id = target_student_id
    where coalesce(m.used_in_paragraph_count, 0) = 0

    union all

    select
      'ao4_drill'::text,
      90,
      qp.id,
      qp.quote_pair_code,
      qp.theme_label,
      'Practise AO4 comparison for ' || qp.quote_pair_code,
      'This quote pair has been practised, but AO4 is not yet marked secure.',
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code
    from public.student_quote_pair_mastery m
    join public.quote_pairs qp on qp.id = m.quote_pair_id
    where m.student_id = target_student_id
      and m.used_in_paragraph_count > 0
      and coalesce(m.ao4_secure, false) = false

    union all

    select
      'review'::text,
      70,
      qp.id,
      qp.quote_pair_code,
      qp.theme_label,
      'Review ' || qp.quote_pair_code,
      'This quote pair has not been practised recently.',
      '/paragraph-builder?quotePairId=' || qp.quote_pair_code
    from public.student_quote_pair_mastery m
    join public.quote_pairs qp on qp.id = m.quote_pair_id
    where m.student_id = target_student_id
      and m.last_practised_at < now() - interval '14 days'
  )
  select *
  from candidates
  order by priority desc, quote_pair_code asc
  limit 1;
$$;
