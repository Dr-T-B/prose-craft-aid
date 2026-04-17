import { useEffect, useState, useCallback } from "react";
import type { Level, QuestionFamily } from "@/data/seed";

export interface EssayPlan {
  id: string;
  updated_at: number;
  question_id?: string;
  family?: QuestionFamily;
  route_id?: string;
  thesis_level: Level;
  thesis_id?: string;
  selected_quote_ids: string[];
  ao5_enabled: boolean;
  selected_ao5_ids: string[];
  notes?: string;
}

const KEY_CURRENT = "c2p.currentPlan.v1";
const KEY_SAVED = "c2p.savedPlans.v1";

export const emptyPlan = (): EssayPlan => ({
  id: `plan_${Date.now()}`,
  updated_at: Date.now(),
  thesis_level: "strong",
  selected_quote_ids: [],
  ao5_enabled: false,
  selected_ao5_ids: [],
});

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useCurrentPlan() {
  const [plan, setPlan] = useState<EssayPlan>(() => read<EssayPlan>(KEY_CURRENT, emptyPlan()));

  useEffect(() => {
    try {
      localStorage.setItem(KEY_CURRENT, JSON.stringify({ ...plan, updated_at: Date.now() }));
    } catch { /* noop */ }
  }, [plan]);

  const update = useCallback((patch: Partial<EssayPlan>) => {
    setPlan((p) => ({ ...p, ...patch }));
  }, []);

  const reset = useCallback(() => setPlan(emptyPlan()), []);

  return { plan, setPlan, update, reset };
}

export function getCurrentPlan(): EssayPlan {
  return read<EssayPlan>(KEY_CURRENT, emptyPlan());
}

export function listSavedPlans(): EssayPlan[] {
  return read<EssayPlan[]>(KEY_SAVED, []);
}

export function savePlan(plan: EssayPlan): EssayPlan[] {
  const all = listSavedPlans();
  const stamped = { ...plan, updated_at: Date.now() };
  const next = [stamped, ...all.filter((p) => p.id !== plan.id)].slice(0, 30);
  try {
    localStorage.setItem(KEY_SAVED, JSON.stringify(next));
  } catch { /* noop */ }
  return next;
}

/** Toolkit -> Builder bridge: a quote id queued for inclusion. */
const KEY_QUEUED_QUOTE = "c2p.queuedQuoteId.v1";
export function queueQuoteForBuilder(quoteId: string) {
  try { localStorage.setItem(KEY_QUEUED_QUOTE, quoteId); } catch {/*noop*/}
}
export function consumeQueuedQuote(): string | null {
  try {
    const v = localStorage.getItem(KEY_QUEUED_QUOTE);
    if (v) localStorage.removeItem(KEY_QUEUED_QUOTE);
    return v;
  } catch { return null; }
}
