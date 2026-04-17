import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/builder", label: "Essay Builder" },
  { to: "/timed", label: "Timed Practice" },
  { to: "/toolkit", label: "Retrieval Toolkit" },
];

export default function AppShell() {
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
          </nav>
        </div>
      </header>
      <main className="flex-1 print-area">
        <Outlet />
      </main>
    </div>
  );
}
