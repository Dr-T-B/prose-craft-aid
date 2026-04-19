-- 1) Fix device-id spoofing: require authenticated ownership only.
-- The previous is_owner() trusted a client-supplied x-device-id header when
-- auth.uid() was null, allowing anonymous users to access any row by
-- spoofing the header. Replace with strict auth-only ownership.
CREATE OR REPLACE FUNCTION public.is_owner(row_user_id uuid, row_device_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND row_user_id IS NOT NULL
     AND row_user_id = auth.uid();
$function$;

-- 2) Fix staged_changes realtime leak: remove the table from the realtime
-- publication so non-admin authenticated subscribers cannot receive
-- proposed_patch / original_snapshot / reviewer payloads.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'staged_changes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.staged_changes';
  END IF;
END $$;