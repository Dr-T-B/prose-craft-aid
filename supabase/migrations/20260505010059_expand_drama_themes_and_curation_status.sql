-- Expand validate_themes and curation_status to support Drama texts
-- (Hamlet and The Duchess of Malfi) added in the A-Level Drama quote bank.

CREATE OR REPLACE FUNCTION public.validate_themes(themes text[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT themes <@ ARRAY[
    -- Existing HT / AT themes
    'class', 'guilt', 'imagination', 'fact vs imagination',
    'memory', 'childhood', 'gender', 'war', 'education',
    -- Drama (Hamlet + Duchess of Malfi) themes
    'death', 'inaction', 'corruption', 'betrayal',
    'appearance_reality', 'surveillance', 'revenge', 'madness',
    'conscience', 'identity', 'power', 'patriarchal_control'
  ]::text[]
  OR themes = '{}'::text[]
  OR themes IS NULL;
$function$;

ALTER TABLE quote_methods
  DROP CONSTRAINT quote_methods_curation_status_check;

ALTER TABLE quote_methods
  ADD CONSTRAINT quote_methods_curation_status_check
  CHECK (curation_status = ANY (ARRAY['review', 'core', 'strong', 'good', 'draft']));
