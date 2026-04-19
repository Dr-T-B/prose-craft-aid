// Supabase write layer for user state (plans, timed sessions, reflections).
// Falls back to localStorage if a write fails so MVP flows never break.

import { supabaseScoped, getOwnerKeys } from "@/integrations/supabase/scopedClient";
import type { EssayPlan, TimedSession } from "@/lib/planStore";
import { saveTimedSession as localSaveSession, savePlan as localSavePlan } from "@/lib/planStore";

/** Save an essay plan to Supabase, mirroring to localStorage. */
export async function persistPlan(plan: EssayPlan, title?: string): Promise<{ remoteId?: string; ok: boolean }> {
  // Always mirror locally first so UX is never blocked.
  localSavePlan(plan);
  try {
    const { user_id, device_id } = await getOwnerKeys();
    const { data, error } = await supabaseScoped
      .from("saved_essay_plans")
      .insert({
        user_id,
        device_id,
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
      })
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false };
    return { remoteId: data.id, ok: true };
  } catch {
    return { ok: false };
  }
}

/** Save a timed session to Supabase, mirroring to localStorage. */
export async function persistTimedSession(
  s: TimedSession,
  meta: { duration_minutes: number; expired: boolean; completed: boolean; word_count: number; plan_remote_id?: string }
): Promise<{ remoteId?: string; ok: boolean }> {
  localSaveSession(s);
  try {
    const { user_id, device_id } = await getOwnerKeys();
    const { data, error } = await supabaseScoped
      .from("timed_sessions")
      .insert({
        user_id,
        device_id,
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

/** Save a reflection bound to a remote timed_session id. */
export async function persistReflection(
  sessionRemoteId: string,
  checklist: Record<string, boolean>,
  firstFailure: string
): Promise<boolean> {
  try {
    const { user_id, device_id } = await getOwnerKeys();
    const { error } = await supabaseScoped
      .from("reflection_entries")
      .insert({
        user_id,
        device_id,
        session_id: sessionRemoteId,
        checklist,
        first_failure_point: firstFailure || null,
      });
    return !error;
  } catch {
    return false;
  }
}

/** Fetch the most recent saved plan for this owner (remote-first). */
export async function fetchLatestPlan() {
  try {
    const { data } = await supabaseScoped
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

/** Fetch the most recent timed session for this owner (remote-first). */
export async function fetchLatestTimedSession() {
  try {
    const { data } = await supabaseScoped
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

/** Fetch recent saved plans (remote-first). */
export async function fetchRecentPlans(limit = 6) {
  try {
    const { data } = await supabaseScoped
      .from("saved_essay_plans")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
