-- Drop the narrow normalization-only table (built moments ago, no data yet).
DROP TABLE IF EXISTS public.normalization_proposals CASCADE;
DROP FUNCTION IF EXISTS public.validate_normalization_proposal() CASCADE;

-- General staged-change system. Carries any future review-led edit, not just
-- vocabulary normalization. The edge function validates the patch against a
-- whitelist before applying via service role.
CREATE TABLE public.staged_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification of the proposed change.
  proposal_type text NOT NULL DEFAULT 'normalization',

  -- Target.
  target_table text NOT NULL,
  target_record_id text NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',

  -- Snapshots. original_snapshot captures the full row at proposal time so
  -- reviewers can see context; proposed_patch is the field→new-value map the
  -- apply step will write. Both jsonb to handle scalars + arrays uniformly.
  original_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_patch jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Source context.
  source_surface text,
  source_finding_id text,
  source_issue_type text,

  -- Reviewer-facing.
  note text,
  status text NOT NULL DEFAULT 'pending',
  apply_error text,

  -- Actors + timestamps.
  proposed_by uuid,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger (mutable rules, no immutable CHECK constraints).
CREATE OR REPLACE FUNCTION public.validate_staged_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','rejected','applied','failed','cancelled') THEN
    RAISE EXCEPTION 'invalid status %', NEW.status;
  END IF;
  IF NEW.proposal_type NOT IN ('normalization','edit') THEN
    RAISE EXCEPTION 'invalid proposal_type %', NEW.proposal_type;
  END IF;
  IF NEW.target_table = '' OR NEW.target_record_id = '' THEN
    RAISE EXCEPTION 'target_table and target_record_id must be non-empty';
  END IF;
  IF coalesce(array_length(NEW.changed_fields, 1), 0) = 0 THEN
    RAISE EXCEPTION 'changed_fields must contain at least one field';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER staged_changes_validate
BEFORE INSERT OR UPDATE ON public.staged_changes
FOR EACH ROW EXECUTE FUNCTION public.validate_staged_change();

CREATE TRIGGER staged_changes_updated_at
BEFORE UPDATE ON public.staged_changes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_staged_changes_status_created
  ON public.staged_changes (status, created_at DESC);

CREATE INDEX idx_staged_changes_target
  ON public.staged_changes (target_table, target_record_id);

ALTER TABLE public.staged_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read staged changes"
  ON public.staged_changes
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert staged changes"
  ON public.staged_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update staged changes"
  ON public.staged_changes
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete staged changes"
  ON public.staged_changes
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));