ALTER PUBLICATION supabase_realtime ADD TABLE public.staged_changes;
ALTER TABLE public.staged_changes REPLICA IDENTITY FULL;