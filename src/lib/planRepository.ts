import { supabase } from "@/lib/supabaseClient";
import { getCurrentPlan, setCurrentPlan, normalizeEssayPlan, listSavedPlans } from "@/lib/planStore";
import type { EssayPlan } from "@/lib/planStore";
import { essayPlanToInsert, rowToEssayPlan } from "@/lib/planCloud";

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function getLocalCurrentPlan(): EssayPlan {
  return getCurrentPlan();
}

export function setLocalCurrentPlan(plan: EssayPlan): void {
  setCurrentPlan(plan);
}

export async function upsertCloudPlan(plan: EssayPlan & { is_current?: boolean }): Promise<EssayPlan> {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("essay_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("client_plan_id", plan.id)
    .maybeSingle();

  const payload = essayPlanToInsert(plan, userId);

  if (existing) {
    const { data, error } = await supabase
      .from("essay_plans")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return rowToEssayPlan(data);
  }

  const { data, error } = await supabase
    .from("essay_plans")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return rowToEssayPlan(data);
}

export async function listCloudPlans(): Promise<EssayPlan[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("essay_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToEssayPlan);
}

export async function deleteCloudPlan(clientPlanId: string): Promise<void> {
  if (!clientPlanId) throw new Error("clientPlanId is required");

  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("essay_plans")
    .delete()
    .eq("user_id", userId)
    .eq("client_plan_id", clientPlanId);

  if (error) throw error;
}

export async function getCurrentPlanHybrid(): Promise<EssayPlan> {
  const userId = await getUserId();
  if (!userId) return getLocalCurrentPlan();

  const { data, error } = await supabase
    .from("essay_plans")
    .select("*")
    .eq("user_id", userId)
    .order("is_current", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return getLocalCurrentPlan();
  return rowToEssayPlan(data);
}

const KEY_MIGRATED = "c2p.migratedToCloud.v1";

export async function migrateLocalPlansToCloud(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const marker = `${KEY_MIGRATED}:${userId}`;
  if (localStorage.getItem(marker) === "true") return;
  localStorage.setItem(marker, "true");

  const current = getLocalCurrentPlan();
  const saved = listSavedPlans();
  const candidates = [...saved, ...(current?.id ? [current] : [])];

  const deduped = new Map<string, EssayPlan>();
  for (const plan of candidates) {
    const normalized = normalizeEssayPlan(plan);
    deduped.set(normalized.id, normalized);
  }

  const results = await Promise.allSettled([...deduped.values()].map(upsertCloudPlan));
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.warn(
      `[ProseCraft] migrateLocalPlansToCloud: ${failures.length} plan(s) failed to upload.`,
      failures
    );
  }
}

export async function saveCurrentPlanHybrid(plan: EssayPlan): Promise<EssayPlan> {
  const userId = await getUserId();
  const normalized = normalizeEssayPlan(plan);
  setLocalCurrentPlan(normalized);

  if (!userId) return normalized;

  // Clear is_current on all other plans for this user before setting the new one
  await supabase
    .from("essay_plans")
    .update({ is_current: false })
    .eq("user_id", userId)
    .eq("is_current", true)
    .neq("client_plan_id", normalized.id);

  return upsertCloudPlan({ ...normalized, is_current: true });
}
