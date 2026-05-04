-- 1. Update policies for timed_sessions to block unauthenticated device_id writes
DROP POLICY IF EXISTS "Insert timed_sessions" ON timed_sessions;
DROP POLICY IF EXISTS "Update timed_sessions" ON timed_sessions;

CREATE POLICY "Insert timed_sessions" 
  ON timed_sessions FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Update timed_sessions" 
  ON timed_sessions FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. Update policies for saved_essay_plans to block unauthenticated device_id writes
DROP POLICY IF EXISTS "Insert saved_essay_plans" ON saved_essay_plans;
DROP POLICY IF EXISTS "Update saved_essay_plans" ON saved_essay_plans;

CREATE POLICY "Insert saved_essay_plans" 
  ON saved_essay_plans FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Update saved_essay_plans" 
  ON saved_essay_plans FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3. Revoke public/anon access to sensitive role functions
REVOKE EXECUTE ON FUNCTION has_role() FROM anon;
REVOKE EXECUTE ON FUNCTION is_owner() FROM anon;

-- 4. Secure the trigger against schema injection
ALTER FUNCTION trigger_set_updated_at() SET search_path = public;