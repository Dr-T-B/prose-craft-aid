
-- =========================================
-- ROLES (admin-only writes for content tables)
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- IMPORT LOGS (admin-only)
-- =========================================
CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset text NOT NULL,
  filename text,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read import logs"
  ON public.import_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert import logs"
  ON public.import_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SAVED VIEWS (per-user, for Import History filter presets)
-- =========================================
CREATE TABLE public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  dataset text NOT NULL DEFAULT '',
  q text NOT NULL DEFAULT '',
  "from" text NOT NULL DEFAULT '',
  "to" text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved views"
  ON public.saved_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved views"
  ON public.saved_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved views"
  ON public.saved_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved views"
  ON public.saved_views FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX saved_views_one_default_per_user
  ON public.saved_views (user_id)
  WHERE is_default = true;

CREATE INDEX saved_views_user_id_created_at_idx
  ON public.saved_views (user_id, created_at DESC);

-- =========================================
-- get_user_emails RPC (admin-only)
-- =========================================
CREATE OR REPLACE FUNCTION public.get_user_emails(_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(_user_ids)
    AND public.has_role(auth.uid(), 'admin'::app_role);
$$;

REVOKE ALL ON FUNCTION public.get_user_emails(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;

-- =========================================
-- Admin write policies for content tables
-- (Existing public read policies are preserved.
--  These add admin INSERT/UPDATE/DELETE so the CSV importer can write.)
-- =========================================
DO $$
DECLARE
  t text;
  content_tables text[] := ARRAY[
    'routes','questions','theses','paragraph_jobs','quote_methods',
    'character_cards','theme_maps','ao5_tensions','comparative_matrix','symbol_entries'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    EXECUTE format($f$
      CREATE POLICY "Admins can insert %1$s"
        ON public.%1$I FOR INSERT
        TO authenticated
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Admins can update %1$s"
        ON public.%1$I FOR UPDATE
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'))
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Admins can delete %1$s"
        ON public.%1$I FOR DELETE
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    $f$, t);
  END LOOP;
END $$;
