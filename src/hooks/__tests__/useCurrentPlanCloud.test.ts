import { renderHook, act } from "@testing-library/react";
import { useCurrentPlanCloud } from "@/hooks/useCurrentPlanCloud";
import * as repository from "@/lib/planRepository";

// Minimal mock of supabase auth
const authListeners: Array<() => void> = [];
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: () => void) => {
        authListeners.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
}));

vi.mock("@/lib/planRepository", () => ({
  getCurrentPlanHybrid: vi.fn(),
  saveCurrentPlanHybrid: vi.fn(),
}));

const mockGetCurrentPlan = repository.getCurrentPlanHybrid as ReturnType<typeof vi.fn>;

const basePlan = {
  id: "plan-1",
  updated_at: 0,
  thesis_level: "strong" as const,
  selected_quote_ids: [],
  ao5_enabled: false,
  selected_ao5_ids: [],
  paragraph_cards: [],
  builder_handoffs: [],
};

test("re-fetches plan when auth state changes", async () => {
  mockGetCurrentPlan
    .mockResolvedValueOnce({ ...basePlan, notes: "before login" })
    .mockResolvedValueOnce({ ...basePlan, notes: "after login" });

  const { result } = renderHook(() => useCurrentPlanCloud());

  // Wait for initial load
  await act(async () => {});
  expect(result.current.plan.notes).toBe("before login");
  expect(mockGetCurrentPlan).toHaveBeenCalledTimes(1);

  // Simulate auth state change (user logs in)
  await act(async () => {
    authListeners.forEach((cb) => cb());
  });

  expect(mockGetCurrentPlan).toHaveBeenCalledTimes(2);
  expect(result.current.plan.notes).toBe("after login");
});

test("exposes error when load fails", async () => {
  mockGetCurrentPlan.mockRejectedValueOnce(new Error("network failure"));

  const { result } = renderHook(() => useCurrentPlanCloud());
  await act(async () => {});

  expect(result.current.error?.message).toBe("network failure");
  expect(result.current.loading).toBe(false);
});

test("rapid successive update calls do not use stale plan state", async () => {
  mockGetCurrentPlan.mockResolvedValueOnce({ ...basePlan, notes: "" });
  const mockSave = repository.saveCurrentPlanHybrid as ReturnType<typeof vi.fn>;
  mockSave.mockResolvedValue(undefined);

  const { result } = renderHook(() => useCurrentPlanCloud());
  await act(async () => {});

  // Call update twice without awaiting between — second must see first's state
  await act(async () => {
    result.current.update({ notes: "first" });
    result.current.update({ notes: "second" });
  });

  // Final plan must reflect both updates, not overwrite first with stale state
  expect(result.current.plan.notes).toBe("second");

  // saveCurrentPlanHybrid should have been called twice
  expect(mockSave).toHaveBeenCalledTimes(2);

  // The second save must have been called with notes="second", not the stale ""
  const secondCallArg = mockSave.mock.calls[1][0];
  expect(secondCallArg.notes).toBe("second");
});
