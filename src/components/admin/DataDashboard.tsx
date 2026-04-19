import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { DATASETS, type DatasetKey } from "@/lib/datasets";

type Tier = "content" | "user-state";
type State = "Seeded" | "Empty" | "Awaiting Activity" | "Live" | "Unknown";
type Status = "Ready" | "Pending" | "Needs Review";

interface DashboardEntry {
  key: DatasetKey;
  displayName: string;
  tableName: string;
  tier: Tier;
  idType: "text" | "uuid";
  note: string;
}

const DISPLAY_OVERRIDES: Record<DatasetKey, string> = {
  routes: "Routes",
  questions: "Questions Engine",
  theses: "Thesis Builder",
  paragraph_jobs: "Paragraph Builder",
  quote_methods: "Quote + Method Bank",
  character_cards: "Character Cards",
  theme_maps: "Theme Maps",
  symbol_entries: "Symbol / Motif Engine",
  comparative_matrix: "Comparative Matrix",
  ao5_tensions: "AO5 Interpretation Engine",
  saved_essay_plans: "Saved Essay Plans",
  timed_sessions: "Timed Writing Sessions",
  reflection_entries: "Reflection Log",
};

const NOTES: Record<DatasetKey, string> = {
  routes: "Controls page routing and app navigation.",
  questions: "Stores exam and practice question content.",
  theses: "Stores thesis-building content and conceptual response starters.",
  paragraph_jobs: "Supports paragraph construction and writing-task generation.",
  quote_methods: "Stores quotations, methods, and linked analytical insight.",
  character_cards: "Stores character-based revision and analysis content.",
  theme_maps: "Stores thematic links and conceptual theme structures.",
  symbol_entries: "Stores symbols, motifs, and recurring textual patterns.",
  comparative_matrix: "Stores cross-text comparison links and analytical pairings.",
  ao5_tensions: "Stores interpretive tensions, debates, and alternative readings.",
  saved_essay_plans: "Stores student-saved essay plans for future editing.",
  timed_sessions: "Stores timed writing session attempts and performance data.",
  reflection_entries: "Stores student reflections and post-task review entries.",
};

const ENTRIES: DashboardEntry[] = DATASETS.map((d) => ({
  key: d.key,
  displayName: DISPLAY_OVERRIDES[d.key] ?? d.label,
  tableName: d.key,
  tier: d.tier,
  idType: d.idType,
  note: NOTES[d.key] ?? d.description,
}));

function deriveState(tier: Tier, count: number | null): { state: State; status: Status } {
  if (count === null) return { state: "Unknown", status: "Needs Review" };
  if (tier === "content") {
    return count > 0
      ? { state: "Seeded", status: "Ready" }
      : { state: "Empty", status: "Needs Review" };
  }
  return count > 0
    ? { state: "Live", status: "Ready" }
    : { state: "Awaiting Activity", status: "Pending" };
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "Ready") {
    return (
      <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))] border-transparent">
        Ready
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge variant="outline" className="border-rule text-ink-muted">
        Pending
      </Badge>
    );
  }
  return <Badge variant="destructive">Needs Review</Badge>;
}

function StateBadge({ state }: { state: State }) {
  const map: Record<State, string> = {
    Seeded: "border-rule text-ink",
    Live: "border-rule text-ink",
    Empty: "border-destructive/40 text-destructive",
    "Awaiting Activity": "border-rule text-ink-muted",
    Unknown: "border-destructive/40 text-destructive",
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${map[state]}`}>
      {state}
    </Badge>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  hint?: string;
}
function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums text-ink">{value}</div>
        {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

interface DataDashboardProps {
  counts: Record<string, number | null>;
}

export default function DataDashboard({ counts }: DataDashboardProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [sortBy, setSortBy] = useState<"name" | "rows">("name");

  const enriched = useMemo(() => {
    return ENTRIES.map((e) => {
      const count = counts[e.key] ?? null;
      const { state, status } = deriveState(e.tier, count);
      return { ...e, count, state, status };
    });
  }, [counts]);

  const filtered = useMemo(() => {
    let list = enriched.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || e.displayName.toLowerCase().includes(q) || e.tableName.toLowerCase().includes(q);
      const matchesTier = tierFilter === "all" || e.tier === tierFilter;
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "rows") return (b.count ?? -1) - (a.count ?? -1);
      return a.displayName.localeCompare(b.displayName);
    });
    return list;
  }, [enriched, search, tierFilter, statusFilter, sortBy]);

  const contentEntries = enriched.filter((e) => e.tier === "content");
  const userEntries = enriched.filter((e) => e.tier === "user-state");

  const totalSeededRows = contentEntries.reduce((sum, e) => sum + (e.count ?? 0), 0);
  const pendingTables = enriched.filter((e) => e.status === "Pending").length;
  const emptyUserTables = userEntries.filter((e) => (e.count ?? 0) === 0).length;
  const contentReady = contentEntries.filter((e) => (e.count ?? 0) > 0).length;
  const contentEmpty = contentEntries.length - contentReady;
  const userLive = userEntries.filter((e) => (e.count ?? 0) > 0).length;

  const attention = enriched.filter(
    (e) =>
      (e.tier === "content" && (e.count ?? 0) === 0) || e.state === "Unknown",
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink">
          Data Manager Dashboard
        </h2>
        <p className="text-sm text-ink-muted">
          Overview of app data structure, readiness, and operational status.
        </p>
        <p className="text-xs text-ink-muted max-w-2xl">
          Monitor seeded academic content, student-generated data, and table readiness from one
          structured overview.
        </p>
      </header>

      {/* KPI cards */}
      <section
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        aria-label="Summary metrics"
      >
        <MetricCard label="Total Tables" value={enriched.length} />
        <MetricCard label="Content Tables" value={contentEntries.length} />
        <MetricCard label="User Tables" value={userEntries.length} />
        <MetricCard label="Total Seeded Rows" value={totalSeededRows.toLocaleString()} />
        <MetricCard label="Pending Tables" value={pendingTables} />
        <MetricCard label="Empty User Tables" value={emptyUserTables} />
      </section>

      {/* Data Health Overview */}
      <section aria-labelledby="data-health">
        <h3
          id="data-health"
          className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3"
        >
          Data Health Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-rule shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-ink">Content Tables</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-ink-muted">
              <div className="flex justify-between">
                <span>Tables</span>
                <span className="tabular-nums text-ink">{contentEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Seeded</span>
                <span className="tabular-nums text-ink">{contentReady}</span>
              </div>
              <div className="flex justify-between">
                <span>Empty</span>
                <span className="tabular-nums text-ink">{contentEmpty}</span>
              </div>
              <p className="pt-2 text-xs">
                {contentEmpty === 0
                  ? "All academic content tables seeded and operational."
                  : `${contentEmpty} content table(s) empty — review required.`}
              </p>
            </CardContent>
          </Card>
          <Card className="border-rule shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-ink">User-State Tables</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-ink-muted">
              <div className="flex justify-between">
                <span>Tables</span>
                <span className="tabular-nums text-ink">{userEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Live</span>
                <span className="tabular-nums text-ink">{userLive}</span>
              </div>
              <div className="flex justify-between">
                <span>Awaiting activity</span>
                <span className="tabular-nums text-ink">{emptyUserTables}</span>
              </div>
              <p className="pt-2 text-xs">
                {emptyUserTables === userEntries.length
                  ? "User tables present, awaiting live student activity."
                  : `${userLive} user table(s) currently active.`}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-end gap-3 no-print">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-ink-muted mb-1" htmlFor="dm-search">
            Search
          </label>
          <Input
            id="dm-search"
            placeholder="Display name or table name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">Tier</label>
          <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as typeof tierFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="user-state">User-State</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">Status</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Needs Review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1">Sort by</label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rows">Row count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Tracked Data Tables */}
      <section aria-labelledby="tracked-tables">
        <h3
          id="tracked-tables"
          className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3"
        >
          Tracked Data Tables
        </h3>
        <Card className="border-rule shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead className="text-right">Row Count</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[240px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.key}>
                    <TableCell className="font-medium text-ink">{e.displayName}</TableCell>
                    <TableCell>
                      <code className="text-xs text-ink-muted">{e.tableName}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase border-rule">
                        {e.tier === "content" ? "Content" : "User-State"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{e.idType}</code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.count ?? "—"}
                    </TableCell>
                    <TableCell><StateBadge state={e.state} /></TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-xs text-ink-muted">{e.note}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-ink-muted py-8">
                      No tables match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Lower panels */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-rule shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink">Readiness Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted leading-relaxed">
            {contentEmpty === 0 && emptyUserTables === userEntries.length
              ? "Academic content tables are seeded and operational. User-state tables are present but currently empty, awaiting live student activity."
              : `${contentReady} of ${contentEntries.length} content tables seeded. ${userLive} of ${userEntries.length} user-state tables active.`}
          </CardContent>
        </Card>
        <Card className="border-rule shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink">Attention Items</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {attention.length === 0 ? (
              <p className="text-ink-muted">No items require review.</p>
            ) : (
              <ul className="space-y-1.5">
                {attention.map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-3">
                    <span className="text-ink">{e.displayName}</span>
                    <StateBadge state={e.state} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
