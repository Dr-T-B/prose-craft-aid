import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const mockSupabase = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mockSupabase.getUser,
    },
    rpc: mockSupabase.rpc,
  },
}));

describe("Dashboard", () => {
  beforeEach(() => {
    mockSupabase.getUser.mockReset();
    mockSupabase.rpc.mockReset();
  });

  it("shows recommendation errors instead of failing silently", async () => {
    mockSupabase.getUser.mockResolvedValue({
      data: { user: { id: "student-1" } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "permission denied for function get_next_best_action" },
    });

    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText("permission denied for function get_next_best_action")).toBeInTheDocument();
  });

  it("keeps recommendation links inside the app", async () => {
    mockSupabase.getUser.mockResolvedValue({
      data: { user: { id: "student-1" } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({
      data: [
        {
          action_type: "build_paragraph",
          priority: 100,
          quote_pair_id: "quote-pair-1",
          quote_pair_code: "QP1",
          theme_label: "Class",
          title: "Build paragraph",
          reason: "Practise the next quote pair.",
          action_url: "https://example.invalid/outside",
        },
      ],
      error: null,
    });

    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Build paragraph")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start/i })).toHaveAttribute("href", "/");
  });
});
