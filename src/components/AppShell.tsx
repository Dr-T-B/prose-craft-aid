import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/builder", label: "Essay Builder" },
  { to: "/timed", label: "Timed Practice" },
  { to: "/toolkit", label: "Retrieval Toolkit" },
];

export default function AppShell() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-dvh bg-background text-ink flex flex-col">
      <header className="border-b border-rule bg-paper/80 backdrop-blur-sm sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl font-medium tracking-tight">Component 2 Prose</span>
            <span className="label-eyebrow hidden sm:inline">Hard Times · Atonement</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs sm:text-sm font-medium rounded-sm border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-ink"
                      : "border-transparent text-ink-muted hover:text-ink hover:bg-paper-dim"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-sm border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-ink"
                      : "border-transparent text-ink-muted hover:text-ink hover:bg-paper-dim"
                  }`
                }
              >
                <Settings className="h-3.5 w-3.5" />
                Admin
              </NavLink>
            )}
            {!loading && (
              user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="ml-1 h-8 gap-1 text-ink-muted hover:text-ink"
                  title={user.email ?? "Sign out"}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              ) : (
                <NavLink
                  to="/auth"
                  className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-sm border-b-2 border-transparent text-ink-muted hover:text-ink hover:bg-paper-dim"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </NavLink>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 print-area">
        <Outlet />
      </main>
    </div>
  );
}
