-- ============================================================
-- Migration: drama_scene_schema
-- Creates all drama_ tables for Component 1 Drama (Hamlet + Duchess)
-- with RLS enabled, read-all for authenticated users,
-- no-write for non-service_role
-- ============================================================

-- 1. drama_scenes -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scenes (
  id                    text PRIMARY KEY,
  play                  text NOT NULL CHECK (play IN ('hamlet', 'duchess')),
  act                   integer NOT NULL CHECK (act BETWEEN 1 AND 5),
  scene                 integer NOT NULL,
  act_scene             text NOT NULL,
  scene_title           text NOT NULL,
  scene_summary         text,
  dramatic_function     text,
  revision_priority     text CHECK (revision_priority IN ('very_high','high','medium','low')),
  exam_value            integer CHECK (exam_value BETWEEN 1 AND 5),
  best_paragraph_position text,
  is_active             boolean DEFAULT true,
  sort_order            integer DEFAULT 100,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (play, act_scene)
);

ALTER TABLE public.drama_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scenes_read_authenticated"
  ON public.drama_scenes FOR SELECT
  TO authenticated
  USING (true);

-- 2. drama_scene_themes -------------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_themes (
  scene_id      text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  theme_family  text NOT NULL,
  strength      text CHECK (strength IN ('high','medium','low')),
  PRIMARY KEY (scene_id, theme_family)
);

ALTER TABLE public.drama_scene_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_themes_read_authenticated"
  ON public.drama_scene_themes FOR SELECT
  TO authenticated
  USING (true);

-- 3. drama_scene_characters ---------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_characters (
  scene_id          text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  character_name    text NOT NULL,
  play              text NOT NULL,
  function_in_scene text,
  is_present        boolean DEFAULT true,
  PRIMARY KEY (scene_id, character_name)
);

ALTER TABLE public.drama_scene_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_characters_read_authenticated"
  ON public.drama_scene_characters FOR SELECT
  TO authenticated
  USING (true);

-- 4. drama_scene_ao2_methods --------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_ao2_methods (
  scene_id  text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  method    text NOT NULL,
  effect    text,
  PRIMARY KEY (scene_id, method)
);

ALTER TABLE public.drama_scene_ao2_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_ao2_methods_read_authenticated"
  ON public.drama_scene_ao2_methods FOR SELECT
  TO authenticated
  USING (true);

-- 5. drama_scene_ao3_context --------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_ao3_context (
  id            text PRIMARY KEY,
  scene_id      text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  context_point text NOT NULL,
  context_type  text,
  exam_use      text,
  sort_order    integer DEFAULT 100
);

ALTER TABLE public.drama_scene_ao3_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_ao3_context_read_authenticated"
  ON public.drama_scene_ao3_context FOR SELECT
  TO authenticated
  USING (true);

-- 6. drama_scene_ao5_readings -------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_ao5_readings (
  id              text PRIMARY KEY,
  scene_id        text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  lens            text,
  interpretation  text NOT NULL,
  sort_order      integer DEFAULT 100
);

ALTER TABLE public.drama_scene_ao5_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_ao5_readings_read_authenticated"
  ON public.drama_scene_ao5_readings FOR SELECT
  TO authenticated
  USING (true);

-- 7. drama_scene_essay_uses ---------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_essay_uses (
  scene_id   text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  essay_use  text NOT NULL,
  PRIMARY KEY (scene_id, essay_use)
);

ALTER TABLE public.drama_scene_essay_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_essay_uses_read_authenticated"
  ON public.drama_scene_essay_uses FOR SELECT
  TO authenticated
  USING (true);

-- 8. drama_scene_ao1_arguments ------------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_ao1_arguments (
  scene_id  text REFERENCES public.drama_scenes(id) ON DELETE CASCADE PRIMARY KEY,
  argument  text NOT NULL
);

ALTER TABLE public.drama_scene_ao1_arguments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_ao1_arguments_read_authenticated"
  ON public.drama_scene_ao1_arguments FOR SELECT
  TO authenticated
  USING (true);

-- 9. drama_scene_ao4_connections ----------------------------------
CREATE TABLE IF NOT EXISTS public.drama_scene_ao4_connections (
  id                    text PRIMARY KEY,
  scene_id              text REFERENCES public.drama_scenes(id) ON DELETE CASCADE,
  linked_scene_act_scene text,
  comparison_point      text NOT NULL,
  sort_order            integer DEFAULT 100
);

ALTER TABLE public.drama_scene_ao4_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drama_scene_ao4_connections_read_authenticated"
  ON public.drama_scene_ao4_connections FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- SEED: Hamlet Act 3 Scene 1 — proof of concept
-- ============================================================

INSERT INTO public.drama_scenes
  (id, play, act, scene, act_scene, scene_title, revision_priority, exam_value, best_paragraph_position)
VALUES
  ('hamlet_3_1', 'hamlet', 3, 1, '3.1',
   'Surveillance, Suicide, and Ophelia',
   'very_high', 5, 'paragraph 2 or 3')
ON CONFLICT (id) DO NOTHING;

-- Themes
INSERT INTO public.drama_scene_themes (scene_id, theme_family, strength) VALUES
  ('hamlet_3_1', 'Madness, Performance, and Theatricality',    'high'),
  ('hamlet_3_1', 'Death, Mortality, and Providence',           'high'),
  ('hamlet_3_1', 'Appearance, Reality, and Surveillance',      'high'),
  ('hamlet_3_1', 'Gender, Sexuality, and Patriarchal Control', 'high'),
  ('hamlet_3_1', 'Revenge, Justice, and Moral Action',         'medium'),
  ('hamlet_3_1', 'Corruption, Disease, and Political Disorder','medium')
ON CONFLICT (scene_id, theme_family) DO NOTHING;

-- Characters
INSERT INTO public.drama_scene_characters (scene_id, character_name, play, function_in_scene, is_present) VALUES
  ('hamlet_3_1', 'Hamlet',  'hamlet', 'Self-divided thinker, performer of instability',            true),
  ('hamlet_3_1', 'Ophelia', 'hamlet', 'Instrument of surveillance, victim of patriarchal obedience', true),
  ('hamlet_3_1', 'Claudius','hamlet', 'Hidden observer, political manipulator',                     true),
  ('hamlet_3_1', 'Polonius','hamlet', 'Director of surveillance and control',                       true)
ON CONFLICT (scene_id, character_name) DO NOTHING;

-- AO2 Methods
INSERT INTO public.drama_scene_ao2_methods (scene_id, method, effect) VALUES
  ('hamlet_3_1', 'Soliloquy',              'Stages inwardness and philosophical self-division'),
  ('hamlet_3_1', 'Rhetorical questioning', 'Dramatizes uncertainty and paralysis'),
  ('hamlet_3_1', 'Antithesis',             'Structures the opposition between life and death'),
  ('hamlet_3_1', 'Surveillance staging',   'Turns private suffering into public political risk'),
  ('hamlet_3_1', 'Imperatives',            'Hamlet''s nunnery language becomes coercive and punitive')
ON CONFLICT (scene_id, method) DO NOTHING;

-- Essay uses
INSERT INTO public.drama_scene_essay_uses (scene_id, essay_use) VALUES
  ('hamlet_3_1', 'Hamlets madness'),
  ('hamlet_3_1', 'Death and suicide'),
  ('hamlet_3_1', 'Ophelia'),
  ('hamlet_3_1', 'Women and patriarchy'),
  ('hamlet_3_1', 'Surveillance and control'),
  ('hamlet_3_1', 'Appearance and reality'),
  ('hamlet_3_1', 'Conscience')
ON CONFLICT (scene_id, essay_use) DO NOTHING;

-- AO1 Argument
INSERT INTO public.drama_scene_ao1_arguments (scene_id, argument) VALUES
  ('hamlet_3_1',
   'This scene is central to any argument that Hamlet is not simply inactive but intellectually and morally paralysed. His language shows that thought itself becomes tragic pressure.')
ON CONFLICT (scene_id) DO NOTHING;

-- AO5 Readings
INSERT INTO public.drama_scene_ao5_readings (id, scene_id, lens, interpretation, sort_order) VALUES
  ('hamlet_3_1_ao5_psychoanalytic', 'hamlet_3_1', 'Psychoanalytic',
   'Hamlet''s disgust with sexuality and death reveals psychological displacement of grief and repressed desire', 10),
  ('hamlet_3_1_ao5_feminist',       'hamlet_3_1', 'Feminist',
   'Ophelia functions as an object of male surveillance and patriarchal control rather than as a subject with interiority', 20),
  ('hamlet_3_1_ao5_political',      'hamlet_3_1', 'Political',
   'The staging of private suffering under state observation anticipates Foucauldian models of disciplinary power', 30)
ON CONFLICT (id) DO NOTHING;
