import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { emptyPlan, normalizeEssayPlan, type EssayPlan } from "@/lib/planStore";
import { getCurrentPlanHybrid, saveCurrentPlanHybrid } from "@/lib/planRepository";

export function useCurrentPlanCloud() {
  const [plan, setPlan] = useState<EssayPlan>(emptyPlan());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // planRef mirrors the latest committed plan so update() never captures a
  // stale closure value — React's functional setState updater runs during
  // render (not at call time), so we cannot rely on it to set `next` before
  // the synchronous await that follows.
  const planRef = useRef<EssayPlan>(plan);

  const loadPlan = useCallback(async (active: { value: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const p = await getCurrentPlanHybrid();
      if (active.value) {
        const normalized = normalizeEssayPlan(p);
        planRef.current = normalized;
        setPlan(normalized);
      }
    } catch (err) {
      if (active.value) setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (active.value) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const active = { value: true };
    loadPlan(active);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadPlan(active);
    });

    return () => {
      active.value = false;
      subscription.unsubscribe();
    };
  }, [loadPlan]);

  const update = useCallback(async (patch: Partial<EssayPlan>) => {
    // Read from planRef (not closed-over `plan`) so rapid successive calls
    // each see the most recently written state, not a stale snapshot.
    const next = normalizeEssayPlan({ ...planRef.current, ...patch, updated_at: Date.now() });
    planRef.current = next; // write back immediately so the next call sees it
    setPlan(next);
    try {
      await saveCurrentPlanHybrid(next);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []); // planRef is a stable object — no deps needed

  const reset = useCallback(async () => {
    const next = emptyPlan();
    planRef.current = next;
    setPlan(next);
    try {
      await saveCurrentPlanHybrid(next);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  return { plan, setPlan, update, reset, loading, error };
}
