-- ============================================================================
-- Migration: thematic_axis_pairing layer
-- Purpose:   Add Edexcel 9ET0/02 thematic axis pairing as a companion
--            to the existing comparative_matrix table.
-- Scope:     Additive only. Does NOT modify any existing table.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. axis_clusters (lookup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS axis_clusters (
  id            text PRIMARY KEY,           -- 'c1', 'c2', ...
  name          text NOT NULL,
  description   text,
  sort_order    integer NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE axis_clusters IS
  'Pedagogical clusters for thematic_axis_pairings. Stable IDs c1-c8.';


-- ---------------------------------------------------------------------------
-- 2. thematic_axis_pairings (main content layer)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thematic_axis_pairings (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- identity
  slug                          text UNIQUE NOT NULL,
  axis_title                    text NOT NULL,
  cluster_id                    text NOT NULL REFERENCES axis_clusters(id),
  theme_family                  text NOT NULL,

  -- exam metadata (no defaults; explicit per record for portability)
  exam_board                    text NOT NULL,
  qualification                 text NOT NULL,
  component                     text NOT NULL,
  paper_code                    text,
  text_1                        text NOT NULL,   -- e.g. 'Hard Times'
  text_2                        text NOT NULL,   -- e.g. 'Atonement'

  -- core comparative content
  text_1_concept                text NOT NULL,
  text_2_concept                text NOT NULL,
  comparative_divergence        text NOT NULL,

  -- AO scaffolding
  ao1_conceptual_argument       text NOT NULL,
  ao2_text_1_methods            text[] NOT NULL DEFAULT '{}',
  ao2_text_2_methods            text[] NOT NULL DEFAULT '{}',
  ao3_text_1_context            text[] NOT NULL DEFAULT '{}',
  ao3_text_2_context            text[] NOT NULL DEFAULT '{}',
  ao4_comparison_type           text NOT NULL,

  -- enrichment (NB: Component 2 assesses AO1-AO4 only; AO5 is not assessed)
  critical_perspectives         text[] NOT NULL DEFAULT '{}',
  likely_exam_stems             text[] NOT NULL DEFAULT '{}',

  -- open-book navigation (chapter / book pointers, not full extracts)
  text_1_locations              text[] NOT NULL DEFAULT '{}',
  text_2_locations              text[] NOT NULL DEFAULT '{}',

  -- mark-scheme calibrated framings
  level_4_version               text NOT NULL,
  level_5_version               text NOT NULL,

  -- non-prescriptive scaffold (chip rail components, not finished sentences)
  sentence_components           jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- guidance
  teacher_note                  text,

  -- metadata
  sort_order                    integer NOT NULL DEFAULT 0,
  is_active                     boolean NOT NULL DEFAULT true,
  created_by                    uuid,                  -- nullable for system rows
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE thematic_axis_pairings IS
  'Edexcel 9ET0/02 comparative thematic axes. Companion to comparative_matrix; does not replace it.';
COMMENT ON COLUMN thematic_axis_pairings.critical_perspectives IS
  'Alternative readings as enrichment for AO1. NOT AO5 (which is not assessed in Component 2).';
COMMENT ON COLUMN thematic_axis_pairings.sentence_components IS
  'jsonb {verbs: string[], connectives: string[], counter_positions: string[]}. Components for student to assemble; never a finished sentence.';
COMMENT ON COLUMN thematic_axis_pairings.created_by IS
  'NULL for system-curated axes. Set to auth.uid() for user-authored drafts.';


-- ---------------------------------------------------------------------------
-- 3. past_paper_questions (the playlist)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS past_paper_questions (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- identity
  question_id                   text UNIQUE NOT NULL,   -- e.g. 'edx_2024_q1'
  exam_board                    text NOT NULL,
  qualification                 text NOT NULL,
  component                     text NOT NULL,
  paper_code                    text NOT NULL,
  exam_year                     integer NOT NULL,
  exam_session                  text,
  question_number               integer NOT NULL,
  theme                         text NOT NULL,           -- 'Childhood', 'Crime and Detection', ...

  -- content
  question_stem                 text NOT NULL,
  micro_axis_topic              text,                    -- short label, e.g. 'female relationships'

  -- calibration
  total_marks                   integer NOT NULL DEFAULT 40,
  ao_emphasis                   text,
  difficulty_band               text,                    -- 'L4 core' | 'L4-L5 bridge' | 'L5 stretch'
  suggested_paragraph_angles    text[] NOT NULL DEFAULT '{}',

  -- provenance
  is_real_paper                 boolean NOT NULL DEFAULT true,
  notes                         text,

  -- metadata
  created_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE past_paper_questions IS
  'Released past-paper questions plus likely-future synthetic stems. is_real_paper distinguishes the two.';


-- ---------------------------------------------------------------------------
-- 4. axis_question_links (junction)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS axis_question_links (
  axis_id       uuid NOT NULL REFERENCES thematic_axis_pairings(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES past_paper_questions(id) ON DELETE CASCADE,
  link_role     text NOT NULL CHECK (link_role IN ('primary', 'supporting')),
  PRIMARY KEY (axis_id, question_id)
);

COMMENT ON TABLE axis_question_links IS
  'Many-to-many link between thematic axes and exam questions. link_role: primary = the lead axis for an essay; supporting = additional axis for L5 sophistication.';


-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_thematic_axis_cluster
  ON thematic_axis_pairings(cluster_id);

CREATE INDEX IF NOT EXISTS idx_thematic_axis_active
  ON thematic_axis_pairings(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_thematic_axis_created_by
  ON thematic_axis_pairings(created_by);

CREATE INDEX IF NOT EXISTS idx_past_paper_year_paper
  ON past_paper_questions(exam_year, paper_code);

CREATE INDEX IF NOT EXISTS idx_past_paper_theme
  ON past_paper_questions(theme);

CREATE INDEX IF NOT EXISTS idx_axis_question_links_axis
  ON axis_question_links(axis_id);

CREATE INDEX IF NOT EXISTS idx_axis_question_links_question
  ON axis_question_links(question_id);


-- ---------------------------------------------------------------------------
-- 6. updated_at trigger (idempotent function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_thematic_axis_pairings ON thematic_axis_pairings;
CREATE TRIGGER set_updated_at_thematic_axis_pairings
  BEFORE UPDATE ON thematic_axis_pairings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();


-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE axis_clusters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE thematic_axis_pairings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_paper_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis_question_links       ENABLE ROW LEVEL SECURITY;

-- Read policies: authenticated users can read active rows + their own drafts
CREATE POLICY axis_clusters_read
  ON axis_clusters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY thematic_axis_pairings_read
  ON thematic_axis_pairings
  FOR SELECT
  TO authenticated
  USING (is_active = true OR created_by = auth.uid());

CREATE POLICY past_paper_questions_read
  ON past_paper_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY axis_question_links_read
  ON axis_question_links
  FOR SELECT
  TO authenticated
  USING (true);

-- Write policy: users can insert/update/delete their own draft axes only.
-- System rows (created_by IS NULL) are managed via service role.
CREATE POLICY thematic_axis_pairings_user_write
  ON thematic_axis_pairings
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());


-- ---------------------------------------------------------------------------
-- 8. Optional future junctions (commented out)
--    Uncomment and adjust foreign key references when ready to wire up.
-- ---------------------------------------------------------------------------

-- CREATE TABLE IF NOT EXISTS axis_quote_links (
--   axis_id     uuid NOT NULL REFERENCES thematic_axis_pairings(id) ON DELETE CASCADE,
--   quote_id    uuid NOT NULL REFERENCES quote_methods(id) ON DELETE CASCADE,
--   relevance   text,
--   PRIMARY KEY (axis_id, quote_id)
-- );

-- CREATE TABLE IF NOT EXISTS axis_route_links (
--   axis_id     uuid NOT NULL REFERENCES thematic_axis_pairings(id) ON DELETE CASCADE,
--   route_id    uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
--   relevance   text,
--   PRIMARY KEY (axis_id, route_id)
-- );


COMMIT;

-- ============================================================================
-- End migration.
-- ============================================================================
