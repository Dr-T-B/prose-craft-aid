import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase.generated";
import {
  type EssayPlan,
  getCurrentPlan,
  setCurrentPlan,
  listSavedPlans,
  savePlan,
  normalizeEssayPlan,
} from "@/lib/planStore";
import { type EssayPlanRow, rowToEssayPlan, essayPlanToInsert } from "@/lib/planCloud";

const KEY_MIGRATED = "c2p.migratedToCloud.v1";

const db = supabase as unknown as ReturnType<typeof createClient<Database>>;

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function getLocalCurrentPlan(): EssayPlan {
  return getCurrentPlan();
}

function getLocalSavedPlans(): EssayPlan[] {
  return listSavedPlans();
}

export async function upsertCloudPlan(plan: EssayPlan): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error("upsertCloudPlan: not authenticated");

  const payload = essayPlanToInsert(plan, userId);
  const { error } = await db
    .from("essay_plans")
    .upsert(payload, { onConflict: "user_id,client_plan_id" }); // PostgREST resolves via named constraint

  if (error) throw error;
}

export async function getCurrentPlanHybrid(): Promise<EssayPlan> {
  const userId = await getUserId();
  if (!userId) return getLocalCurrentPlan();

  const { data, error } = await db
    .from("essay_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return getLocalCurrentPlan();
  return rowToEssayPlan(data as EssayPlanRow);
}

export async function saveCurrentPlanHybrid(plan: EssayPlan): Promise<void> {
  setCurrentPlan(plan);
  const userId = await getUserId();
  if (!userId) return;
  await upsertCloudPlan(plan);
}

export async function listSavedPlansHybrid(): Promise<EssayPlan[]> {
  const userId = await getUserId();
  if (!userId) return getLocalSavedPlans();

  const { data, error } = await db
    .from("essay_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return getLocalSavedPlans();
  return (data as EssayPlanRow[]).map(rowToEssayPlan);
}

export async function savePlanHybrid(plan: EssayPlan): Promise<void> {
  savePlan(plan);
  const userId = await getUserId();
  if (!userId) return;
  await upsertCloudPlan(plan);
}

// Fix 1: set marker BEFORE the upload loop to block any concurrent invocation.
// Fix 2: replace sequential for-await with parallel Promise.all.
export async function migrateLocalPlansToCloud(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const marker = `${KEY_MIGRATED}:${userId}`;
  if (localStorage.getItem(marker) === "true") return;
  localStorage.setItem(marker, "true"); // moved before awaits — blocks concurrent calls

  const current = getLocalCurrentPlan();
  const saved = getLocalSavedPlans();
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

// Fix 3: guard against missing clientPlanId before hitting the DB.
export async function deleteCloudPlan(clientPlanId: string): Promise<void> {
  if (!clientPlanId) throw new Error("deleteCloudPlan: clientPlanId is required");

  const { error } = await db
    .from("essay_plans")
    .delete()
    .eq("client_plan_id", clientPlanId);

  if (error) throw error;
}
