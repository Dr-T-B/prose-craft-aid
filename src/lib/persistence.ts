// Supabase write layer for user state (plans, timed sessions, reflections).
//
// Security model: row ownership is auth-only. Signed-in users persist to the
// backend; anonymous users persist to localStorage only (the LocalOnlyNotice
// banner surfaces this to them). We never attempt anonymous backend writes
// because RLS will reject them under the current `is_owner` definition.

import { supabase } from "@/integrations/supabase/client";
import type { EssayPlan, TimedSession } from "@/lib/planStore";
import { saveTimedSession as localSaveSession, savePlan as localSavePlan } from "@/lib/planStore";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Save an essay plan to Supabase (when signed in), mirroring to localStorage.
 *  Uses localStorage key `c2p.remotePlanId.<plan.id>` to track the remote row
 *  so re-saving the same plan updates the existing row instead of inserting a new one. */
export async function persistPlan(plan: EssayPlan, title?: string): Promise<{ remoteId?: string; ok: boolean }> {
  // Always mirror locally first so UX is never blocked.
  localSavePlan(plan);
  try {
    const user_id = await currentUserId();
    if (!user_id) return { ok: false };

    const remoteIdKey = `c2p.remotePlanId.${plan.id}`;
    const existingRemoteId = localStorage.getItem(remoteIdKey);

    const row = {
      user_id,
      title: title ?? null,
      question_id: plan.question_id ?? null,
      route_id: plan.route_id ?? null,
      thesis_id: plan.thesis_id ?? null,
      thesis_level: plan.thesis_level ?? null,
      family: plan.family ?? null,
      ao5_enabled: plan.ao5_enabled,
      selected_ao5_ids: plan.selected_ao5_ids,
      selected_quote_ids: plan.selected_quote_ids,
      paragraph_job_ids: [],
      paragraph_cards: (plan.paragraph_cards ?? []) as unknown as never,
    };

    let data: { id: string } | null = null;
    let error: unknown = null;

    if (existingRemoteId) {
      ({ data, error } = await supabase
        .from("saved_essay_plans")
        .update(row)
        .eq("id", existingRemoteId)
        .select("id")
        .maybeSingle());
    } else {
      ({ data, error } = await supabase
        .from("saved_essay_plans")
        .insert(row)
        .select("id")
        .maybeSingle());
    }

    if (error || !data) return { ok: false };
    // Persist the remote id so future saves update the same row.
    localStorage.setItem(remoteIdKey, data.id);
    return { remoteId: data.id, ok: true };
  } catch {
    return { ok: false };
  }
}

/** Save a timed session to Supabase (when signed in), mirroring to localStorage. */
export async function persistTimedSession(
  s: TimedSession,
  meta: { duration_minutes: number; expired: boolean; completed: boolean; word_count: number; plan_remote_id?: string }
): Promise<{ remoteId?: string; ok: boolean }> {
  localSaveSession(s);
  try {
    const user_id = await currentUserId();
    if (!user_id) return { ok: false };
    const { data, error } = await supabase
      .from("timed_sessions")
      .insert({
        user_id,
        plan_id: meta.plan_remote_id ?? null,
        mode_id: s.mode_id,
        duration_minutes: meta.duration_minutes,
        response_text: s.response,
        word_count: meta.word_count,
        completed: meta.completed,
        expired: meta.expired,
        ended_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false };
    return { remoteId: data.id, ok: true };
  } catch {
    return { ok: false };
  }
}

/** Save a reflection bound to a remote timed_session id (signed-in only). */
export async function persistReflection(
  sessionRemoteId: string,
  checklist: Record<string, boolean>,
  firstFailure: string
): Promise<boolean> {
  try {
    const user_id = await currentUserId();
    if (!user_id) return false;
    const { error } = await supabase
      .from("reflection_entries")
      .insert({
        user_id,
        session_id: sessionRemoteId,
        checklist,
        first_failure_point: firstFailure || null,
      });
    return !error;
  } catch {
    return false;
  }
}

/** Fetch the most recent saved plan for this user (signed-in only). */
export async function fetchLatestPlan() {
  try {
    if (!(await currentUserId())) return null;
    const { data } = await supabase
      .from("saved_essay_plans")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/** Fetch the most recent timed session for this user (signed-in only). */
export async function fetchLatestTimedSession() {
  try {
    if (!(await currentUserId())) return null;
    const { data } = await supabase
      .from("timed_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/** Fetch recent saved plans (signed-in only). */
export async function fetchRecentPlans(limit = 6) {
  try {
    if (!(await currentUserId())) return [];
    const { data } = await supabase
      .from("saved_essay_plans")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
