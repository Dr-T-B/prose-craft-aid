-- Normalization proposals: review-queue staging for vocabulary cleanup.
-- Proposals never mutate live records directly — an edge function applies
-- approved changes after re-validating that current_value still matches.

CREATE TABLE public.normalization_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target of the proposed change.
  target_table text NOT NULL,
  target_record_id text NOT NULL,
  target_field text NOT NULL,

  -- Snapshot of the value at proposal time + proposed replacement.
  -- jsonb so we can carry scalars, arrays (e.g. likely_core_methods), etc.
  current_value jsonb,
  proposed_value jsonb,

  -- Source context (where the proposal came from).
  source_surface text NOT NULL DEFAULT 'vocabulary_audit',
  source_issue_type text,
  source_value text,

  -- Reviewer note + lifecycle.
  note text,
  status text NOT NULL DEFAULT 'pending',
  apply_error text,

  proposed_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Status validation via trigger (CHECK constraints stay immutable; trigger
-- keeps things flexible and matches the project's existing pattern).
CREATE OR REPLACE FUNCTION public.validate_normalization_proposal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','rejected','failed') THEN
    RAISE EXCEPTION 'invalid status %', NEW.status;
  END IF;
  IF NEW.target_table = '' OR NEW.target_field = '' OR NEW.target_record_id = '' THEN
    RAISE EXCEPTION 'target_table, target_field, target_record_id must be non-empty';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalization_proposals_validate
BEFORE INSERT OR UPDATE ON public.normalization_proposals
FOR EACH ROW EXECUTE FUNCTION public.validate_normalization_proposal();

CREATE TRIGGER normalization_proposals_updated_at
BEFORE UPDATE ON public.normalization_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_normalization_proposals_status_created
  ON public.normalization_proposals (status, created_at DESC);

CREATE INDEX idx_normalization_proposals_target
  ON public.normalization_proposals (target_table, target_record_id);

ALTER TABLE public.normalization_proposals ENABLE ROW LEVEL SECURITY;

-- Admin-only access (read + write). Service role bypasses RLS for the
-- apply edge function, so no special policy is needed for that path.
CREATE POLICY "Admins can read normalization proposals"
  ON public.normalization_proposals
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert normalization proposals"
  ON public.normalization_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update normalization proposals"
  ON public.normalization_proposals
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete normalization proposals"
  ON public.normalization_proposals
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));