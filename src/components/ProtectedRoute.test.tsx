import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

const mockAuth = vi.hoisted(() => ({
  value: {
    user: null,
    isAdmin: false,
    loading: false,
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth.value,
}));

function renderProtected(requireAdmin = false) {
  return render(
    <MemoryRouter
      initialEntries={["/protected"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requireAdmin={requireAdmin}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div>Auth page</div>} />
        <Route path="/" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockAuth.value = {
      user: null,
      isAdmin: false,
      loading: false,
    };
  });

  it("redirects unauthenticated users to auth", () => {
    renderProtected();

    expect(screen.getByText("Auth page")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    mockAuth.value = {
      user: { id: "student-1" },
      isAdmin: false,
      loading: false,
    };

    renderProtected();

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects non-admin users away from admin-only content", () => {
    mockAuth.value = {
      user: { id: "student-1" },
      isAdmin: false,
      loading: false,
    };

    renderProtected(true);

    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
  });
});
