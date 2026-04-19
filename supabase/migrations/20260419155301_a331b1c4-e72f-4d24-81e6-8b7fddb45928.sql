ALTER TABLE public.saved_essay_plans
ADD COLUMN IF NOT EXISTS paragraph_cards jsonb NOT NULL DEFAULT '[]'::jsonb;