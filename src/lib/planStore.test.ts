import { beforeEach, describe, expect, it } from "vitest";
import { getCurrentPlan, normalizeEssayPlan, savePlan, setCurrentPlan } from "./planStore";

describe("plan store normalization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes sparse plans into stable current-plan defaults", () => {
    const plan = normalizeEssayPlan({
      id: "plan_sparse",
      selected_quote_ids: ["q1", "q1"],
      selected_ao5_ids: ["a1", "a1", "a2", "a3", "a4"],
    });

    expect(plan.id).toBe("plan_sparse");
    expect(plan.selected_quote_ids).toEqual(["q1"]);
    expect(plan.selected_ao5_ids).toEqual(["a1", "a2", "a3"]);
    expect(plan.builder_handoffs).toEqual([]);
    expect(plan.paragraph_cards).toEqual([]);
  });

  it("normalizes plans when written to current-plan storage", () => {
    setCurrentPlan({
      ...normalizeEssayPlan({ id: "plan_current" }),
      selected_quote_ids: ["q1", "q1"],
      builder_handoffs: undefined,
    });

    const plan = getCurrentPlan();
    expect(plan.selected_quote_ids).toEqual(["q1"]);
    expect(plan.builder_handoffs).toEqual([]);
  });

  it("normalizes locally saved plans before storing them", () => {
    const [saved] = savePlan({
      ...normalizeEssayPlan({ id: "plan_saved" }),
      selected_quote_ids: ["q1", "q1"],
      selected_ao5_ids: ["a1", "a1", "a2", "a3", "a4"],
    });

    expect(saved.selected_quote_ids).toEqual(["q1"]);
    expect(saved.selected_ao5_ids).toEqual(["a1", "a2", "a3"]);
  });
});
