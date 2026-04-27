import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useGradeBMode } from "@/contexts/GradeBModeContext";

type AppMode = "build" | "explore";

const modeLinks = [
  { to: "/", label: "Build", mode: "build" as AppMode },
  { to: "/library", label: "Explore", mode: "explore" as AppMode },
];

const buildLinks = [
  { to: "/", label: "Build home", end: true },
  { to: "/builder", label: "Essay Builder" },
  { to: "/paragraph-engine", label: "Paragraph Engine" },
  { to: "/timed", label: "Timed Practice" },
  { to: "/toolkit", label: "Retrieval Toolkit" },
];

const exploreLinks = [
  { to: "/library", label: "Library", end: true },
  { to: "/library/quotes", label: "Quotes" },
  { to: "/library/questions", label: "Questions" },
  { to: "/library/comparison", label: "Comparison" },
  { to: "/library/thesis", label: "Thesis & Paragraph" },
  { to: "/library/context", label: "Context" },
  { to: "/library/glossary", label: "Glossary" },
  { to: "/modules", label: "Modules" },
];

function cleanPath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function getAppMode(pathname: string): AppMode {
  const path = cleanPath(pathname);
  if (path === "/library" || path.startsWith("/library/") || path === "/modules" || path.startsWith("/modules/")) return "explore";
  return "build";
}

export default function AppShell() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { gradeBMode, setGradeBMode } = useGradeBMode();
  const navigate = useNavigate();
  const location = useLocation();
  const appMode = getAppMode(location.pathname);
  const sectionLinks = appMode === "explore" ? exploreLinks : buildLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-dvh bg-background text-ink flex flex-col">
      <header className="border-b border-rule bg-paper/80 backdrop-blur-sm sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-xl font-medium tracking-tight">Prose Craft Aid</span>
              <span className="label-eyebrow hidden sm:inline">Hard Times · Atonement</span>
            </div>
            <div className="flex items-center gap-3">
              <label
                htmlFor="grade-b-mode"
                className="hidden md:inline-flex items-center gap-2 border border-rule bg-paper-dim/50 px-2.5 py-1.5 rounded-sm"
              >
                <span className="text-xs font-mono text-ink-muted">Grade B Mode</span>
                <Switch
                  id="grade-b-mode"
                  checked={gradeBMode}
                  onCheckedChange={setGradeBMode}
                  aria-label="Toggle Grade B Mode"
                  className="h-5 w-9 data-[state=checked]:bg-primary"
                />
              </label>
              <nav className="inline-flex border border-rule rounded-sm overflow-hidden" aria-label="Product mode">
                {modeLinks.map((l) => {
                  const isActive = appMode === l.mode;
                  return (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.to === "/"}
                      className={`px-4 py-1.5 text-sm font-medium border-r border-rule last:border-r-0 transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-paper hover:bg-paper-dim text-ink-muted"
                      }`}
                    >
                      {l.label}
                    </NavLink>
                  );
                })}
              </nav>
              {!loading && (
                user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-8 gap-1 text-ink-muted hover:text-ink"
                    title={user.email ?? "Sign out"}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                ) : (
                  <NavLink
                    to="/auth"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-sm border-b-2 border-transparent text-ink-muted hover:text-ink hover:bg-paper-dim"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </NavLink>
                )
              )}
            </div>
          </div>

          <nav className="mt-3 flex items-center gap-1 sm:gap-2 overflow-x-auto" aria-label={appMode === "explore" ? "Explore navigation" : "Build navigation"}>
            {sectionLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
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
            <label
              htmlFor="grade-b-mode-mobile"
              className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm border-b-2 border-transparent text-ink-muted"
            >
              <span>Grade B Mode</span>
              <Switch
                id="grade-b-mode-mobile"
                checked={gradeBMode}
                onCheckedChange={setGradeBMode}
                aria-label="Toggle Grade B Mode"
                className="h-5 w-9 data-[state=checked]:bg-primary"
              />
            </label>
          </nav>
        </div>
      </header>
      <main className="flex-1 print-area">
        <Outlet />
      </main>
    </div>
  );
}
