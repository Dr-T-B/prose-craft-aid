/**
 * Integration smoke test — runs against the real Supabase project.
 * Skipped unless INTEGRATION=true is set in the environment.
 *
 * Usage:
 *   INTEGRATION=true \
 *   TEST_USER_EMAIL=... \
 *   TEST_USER_PASSWORD=... \
 *   npx vitest run src/lib/__tests__/planRepository.integration.test.ts
 */
import { describe, test, expect, beforeAll } from "vitest";
import { supabase } from "@/lib/supabaseClient";
import {
  upsertCloudPlan,
  listCloudPlans,
  deleteCloudPlan,
  saveCurrentPlanHybrid,
  getCurrentPlanHybrid,
} from "@/lib/planRepository";

const RUN = process.env.INTEGRATION === "true";

const basePlan = {
  id: `smoke-test-${Date.now()}`,
  updated_at: Date.now(),
  thesis_level: "strong" as const,
  selected_quote_ids: [] as string[],
  ao5_enabled: false,
  selected_ao5_ids: [] as string[],
  paragraph_cards: [] as never[],
  builder_handoffs: [] as never[],
};

describe.skipIf(!RUN)("planRepository integration", () => {
  beforeAll(async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    });
    if (error) throw new Error(`Auth failed: ${error.message}`);
  });

  test("upsert, list, and delete a plan", async () => {
    const saved = await upsertCloudPlan(basePlan);
    expect(saved.id).toBe(basePlan.id);

    const plans = await listCloudPlans();
    expect(plans.some((p) => p.id === basePlan.id)).toBe(true);

    // Upsert again — must not create a duplicate
    await upsertCloudPlan({ ...basePlan, notes: "updated" });
    const plans2 = await listCloudPlans();
    const matches = plans2.filter((p) => p.id === basePlan.id);
    expect(matches).toHaveLength(1);
    expect(matches[0].notes).toBe("updated");

    await deleteCloudPlan(basePlan.id);
    const plans3 = await listCloudPlans();
    expect(plans3.some((p) => p.id === basePlan.id)).toBe(false);
  });

  test("saveCurrentPlanHybrid sets is_current and clears previous", async () => {
    const planA = { ...basePlan, id: `smoke-a-${Date.now()}` };
    const planB = { ...basePlan, id: `smoke-b-${Date.now()}` };

    await saveCurrentPlanHybrid(planA);
    await saveCurrentPlanHybrid(planB);

    const current = await getCurrentPlanHybrid();
    expect(current.id).toBe(planB.id);

    // Cleanup
    await deleteCloudPlan(planA.id);
    await deleteCloudPlan(planB.id);
  });

  test("deleteCloudPlan throws on empty id", async () => {
    await expect(deleteCloudPlan("")).rejects.toThrow("clientPlanId is required");
  });
});
