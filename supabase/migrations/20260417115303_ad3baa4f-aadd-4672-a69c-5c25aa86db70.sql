-- =====================================================================
-- SHARED HELPERS
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Owner check: a row is "owned" by the caller if either
--   (a) they are authenticated and the row.user_id matches auth.uid(), OR
--   (b) they are anonymous and the row.device_id matches the request header
--       'x-device-id' provided by the client.
CREATE OR REPLACE FUNCTION public.is_owner(row_user_id uuid, row_device_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (auth.uid() IS NOT NULL AND row_user_id = auth.uid())
    OR
    (auth.uid() IS NULL
      AND row_device_id IS NOT NULL
      AND row_device_id = current_setting('request.headers', true)::json->>'x-device-id');
$$;

-- =====================================================================
-- CONTENT TABLES (public read, no client writes)
-- =====================================================================

CREATE TABLE public.routes (
  id text PRIMARY KEY,
  name text NOT NULL,
  core_question text NOT NULL,
  hard_times_emphasis text NOT NULL,
  atonement_emphasis text NOT NULL,
  comparative_insight text NOT NULL,
  best_use text NOT NULL,
  level_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id text PRIMARY KEY,
  family text NOT NULL,
  stem text NOT NULL,
  primary_route_id text NOT NULL REFERENCES public.routes(id),
  secondary_route_id text NOT NULL REFERENCES public.routes(id),
  likely_core_methods text[] NOT NULL DEFAULT '{}',
  level_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_family ON public.questions(family);

CREATE TABLE public.theses (
  id text PRIMARY KEY,
  route_id text NOT NULL REFERENCES public.routes(id),
  theme_family text NOT NULL,
  level text NOT NULL,
  thesis_text text NOT NULL,
  paragraph_job_1_label text NOT NULL,
  paragraph_job_2_label text NOT NULL,
  paragraph_job_3_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_theses_route_family_level ON public.theses(route_id, theme_family, level);
CREATE INDEX idx_theses_family ON public.theses(theme_family);

CREATE TABLE public.paragraph_jobs (
  id text PRIMARY KEY,
  question_family text NOT NULL,
  route_id text NOT NULL REFERENCES public.routes(id),
  job_title text NOT NULL,
  text1_prompt text NOT NULL,
  text2_prompt text NOT NULL,
  divergence_prompt text NOT NULL,
  judgement_prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_paragraph_jobs_family_route ON public.paragraph_jobs(question_family, route_id);

CREATE TABLE public.quote_methods (
  id text PRIMARY KEY,
  source_text text NOT NULL,
  quote_text text NOT NULL,
  method text NOT NULL,
  best_themes text[] NOT NULL DEFAULT '{}',
  effect_prompt text NOT NULL,
  meaning_prompt text NOT NULL,
  level_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quote_methods_themes ON public.quote_methods USING GIN(best_themes);

CREATE TABLE public.ao5_tensions (
  id text PRIMARY KEY,
  focus text NOT NULL,
  dominant_reading text NOT NULL,
  alternative_reading text NOT NULL,
  safe_stem text NOT NULL,
  best_use text[] NOT NULL DEFAULT '{}',
  level_tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ao5_best_use ON public.ao5_tensions USING GIN(best_use);

CREATE TABLE public.character_cards (
  id text PRIMARY KEY,
  source_text text NOT NULL,
  name text NOT NULL,
  one_line text NOT NULL,
  themes text[] NOT NULL DEFAULT '{}',
  core_function text,
  complication text,
  structural_role text,
  comparative_link text,
  common_misreading text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.theme_maps (
  id text PRIMARY KEY,
  family text NOT NULL UNIQUE,
  one_line text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.symbol_entries (
  id text PRIMARY KEY,
  source_text text NOT NULL,
  name text NOT NULL,
  one_line text NOT NULL,
  themes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comparative_matrix (
  id text PRIMARY KEY,
  axis text NOT NULL,
  hard_times text NOT NULL,
  atonement text NOT NULL,
  divergence text NOT NULL,
  themes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at triggers on content tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'routes','questions','theses','paragraph_jobs','quote_methods',
    'ao5_tensions','character_cards','theme_maps','symbol_entries','comparative_matrix'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END$$;

-- RLS: enable, public SELECT, deny everything else from clients
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'routes','questions','theses','paragraph_jobs','quote_methods',
    'ao5_tensions','character_cards','theme_maps','symbol_entries','comparative_matrix'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "Public read %I" ON public.%I FOR SELECT USING (true);', t, t);
  END LOOP;
END$$;

-- =====================================================================
-- USER-STATE TABLES (private per user OR per device)
-- =====================================================================

CREATE TABLE public.saved_essay_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  title text,
  question_id text,
  route_id text,
  family text,
  thesis_level text,
  thesis_id text,
  paragraph_job_ids text[] NOT NULL DEFAULT '{}',
  selected_quote_ids text[] NOT NULL DEFAULT '{}',
  selected_ao5_ids text[] NOT NULL DEFAULT '{}',
  ao5_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_owner_present CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);
CREATE INDEX idx_plans_user ON public.saved_essay_plans(user_id);
CREATE INDEX idx_plans_device ON public.saved_essay_plans(device_id);

CREATE TABLE public.timed_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  plan_id uuid REFERENCES public.saved_essay_plans(id) ON DELETE SET NULL,
  mode_id text NOT NULL,
  duration_minutes integer NOT NULL,
  response_text text NOT NULL DEFAULT '',
  word_count integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  expired boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_owner_present CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);
CREATE INDEX idx_sessions_user ON public.timed_sessions(user_id);
CREATE INDEX idx_sessions_device ON public.timed_sessions(device_id);
CREATE INDEX idx_sessions_plan ON public.timed_sessions(plan_id);

CREATE TABLE public.reflection_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  session_id uuid NOT NULL REFERENCES public.timed_sessions(id) ON DELETE CASCADE,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_failure_point text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reflection_owner_present CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);
CREATE INDEX idx_reflections_user ON public.reflection_entries(user_id);
CREATE INDEX idx_reflections_device ON public.reflection_entries(device_id);
CREATE INDEX idx_reflections_session ON public.reflection_entries(session_id);

-- updated_at triggers
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.saved_essay_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.timed_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reflections_updated BEFORE UPDATE ON public.reflection_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for user-state
ALTER TABLE public.saved_essay_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timed_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_entries ENABLE ROW LEVEL SECURITY;

-- Plans
CREATE POLICY "Owners can view their plans"
  ON public.saved_essay_plans FOR SELECT
  USING (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can insert plans"
  ON public.saved_essay_plans FOR INSERT
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can update their plans"
  ON public.saved_essay_plans FOR UPDATE
  USING (public.is_owner(user_id, device_id))
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can delete their plans"
  ON public.saved_essay_plans FOR DELETE
  USING (public.is_owner(user_id, device_id));

-- Timed sessions
CREATE POLICY "Owners can view their sessions"
  ON public.timed_sessions FOR SELECT
  USING (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can insert sessions"
  ON public.timed_sessions FOR INSERT
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can update their sessions"
  ON public.timed_sessions FOR UPDATE
  USING (public.is_owner(user_id, device_id))
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can delete their sessions"
  ON public.timed_sessions FOR DELETE
  USING (public.is_owner(user_id, device_id));

-- Reflections
CREATE POLICY "Owners can view their reflections"
  ON public.reflection_entries FOR SELECT
  USING (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can insert reflections"
  ON public.reflection_entries FOR INSERT
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can update their reflections"
  ON public.reflection_entries FOR UPDATE
  USING (public.is_owner(user_id, device_id))
  WITH CHECK (public.is_owner(user_id, device_id));

CREATE POLICY "Owners can delete their reflections"
  ON public.reflection_entries FOR DELETE
  USING (public.is_owner(user_id, device_id));