-- Extend quote_methods with rich structured fields from JSON quote exports.
-- All new columns are nullable so existing seed rows are unaffected.

ALTER TABLE quote_methods
  ADD COLUMN IF NOT EXISTS speaker_or_narrator       text,
  ADD COLUMN IF NOT EXISTS location_reference        text,
  ADD COLUMN IF NOT EXISTS plain_english_meaning     text,
  ADD COLUMN IF NOT EXISTS linked_motifs             text[],
  ADD COLUMN IF NOT EXISTS linked_context            text[],
  ADD COLUMN IF NOT EXISTS linked_interpretations    text[],
  ADD COLUMN IF NOT EXISTS opening_stems             text[],
  ADD COLUMN IF NOT EXISTS comparative_prompts       text[],
  ADD COLUMN IF NOT EXISTS grade_priority            text,
  ADD COLUMN IF NOT EXISTS is_core_quote             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS b_mode_rank               integer,
  ADD COLUMN IF NOT EXISTS exam_question_tags        text[],
  ADD COLUMN IF NOT EXISTS recommended_for_questions text[],
  ADD COLUMN IF NOT EXISTS question_types            text[],
  ADD COLUMN IF NOT EXISTS ao_priority               text[],
  ADD COLUMN IF NOT EXISTS comparison_strength       text,
  ADD COLUMN IF NOT EXISTS retrieval_priority        integer,
  ADD COLUMN IF NOT EXISTS best_used_for             text[];

-- Unique index on (quote_text, source_text) so the import script can upsert
-- without creating duplicates when re-run. Uses a partial-length hash to
-- keep the index lean for long quote strings.
CREATE UNIQUE INDEX IF NOT EXISTS quote_methods_text_source_uq
  ON quote_methods (source_text, md5(quote_text));
