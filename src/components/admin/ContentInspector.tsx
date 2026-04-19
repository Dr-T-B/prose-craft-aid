import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  RefreshCw,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RecordEditor, {
  EDITABLE_TABLE_CONFIG,
  isEditableTable,
  type EditableTableKey,
} from "./RecordEditor";

type ContentTableKey =
  | "routes"
  | "questions"
  | "theses"
  | "paragraph_jobs"
  | "quote_methods"
  | "character_cards"
  | "theme_maps"
  | "symbol_entries"
  | "comparative_matrix"
  | "ao5_tensions";

interface PreviewColumn {
  field: string;
  label: string;
  truncate?: boolean;
}

interface FilterField {
  field: string;
  label: string;
}

interface ContentTableConfig {
  key: ContentTableKey;
  displayName: string;
  titleField: string;
  searchableFields: string[];
  previewColumns: PreviewColumn[];
  /** Fields used for completeness scoring (table-specific) */
  completenessFields: string[];
  /** Optional adaptive filter fields */
  optionalFilterFields?: FilterField[];
}

/** Generic completeness fallback if a config lacks completenessFields */
const GENERIC_COMPLETENESS_FALLBACK = ["id"];

const CONFIGS: ContentTableConfig[] = [
  {
    key: "routes",
    displayName: "Routes",
    titleField: "name",
    searchableFields: ["id", "name", "core_question", "best_use", "level_tag"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "name", label: "Name" },
      { field: "level_tag", label: "Level" },
      { field: "core_question", label: "Core question", truncate: true },
    ],
    completenessFields: ["name", "core_question", "atonement_emphasis", "hard_times_emphasis", "best_use"],
    optionalFilterFields: [{ field: "level_tag", label: "Level" }],
  },
  {
    key: "questions",
    displayName: "Questions Engine",
    titleField: "stem",
    searchableFields: ["id", "stem", "family", "level_tag", "primary_route_id"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "stem", label: "Stem", truncate: true },
      { field: "family", label: "Family" },
      { field: "level_tag", label: "Level" },
    ],
    completenessFields: ["stem", "family", "level_tag", "primary_route_id", "secondary_route_id", "likely_core_methods"],
    optionalFilterFields: [
      { field: "family", label: "Family" },
      { field: "level_tag", label: "Level" },
      { field: "primary_route_id", label: "Route" },
    ],
  },
  {
    key: "theses",
    displayName: "Thesis Builder",
    titleField: "thesis_text",
    searchableFields: ["id", "thesis_text", "theme_family", "level", "route_id"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "thesis_text", label: "Thesis", truncate: true },
      { field: "theme_family", label: "Theme" },
      { field: "level", label: "Level" },
    ],
    completenessFields: ["thesis_text", "theme_family", "level", "route_id", "paragraph_job_1_label", "paragraph_job_2_label"],
    optionalFilterFields: [
      { field: "theme_family", label: "Theme" },
      { field: "level", label: "Level" },
      { field: "route_id", label: "Route" },
    ],
  },
  {
    key: "paragraph_jobs",
    displayName: "Paragraph Builder",
    titleField: "job_title",
    searchableFields: ["id", "job_title", "question_family", "route_id"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "job_title", label: "Job title" },
      { field: "question_family", label: "Family" },
      { field: "route_id", label: "Route" },
    ],
    completenessFields: ["job_title", "question_family", "route_id", "text1_prompt", "text2_prompt", "judgement_prompt"],
    optionalFilterFields: [
      { field: "question_family", label: "Family" },
      { field: "route_id", label: "Route" },
    ],
  },
  {
    key: "quote_methods",
    displayName: "Quote + Method Bank",
    titleField: "quote_text",
    searchableFields: ["id", "quote_text", "method", "source_text", "level_tag"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "quote_text", label: "Quote", truncate: true },
      { field: "method", label: "Method" },
      { field: "source_text", label: "Text" },
      { field: "level_tag", label: "Level" },
    ],
    completenessFields: ["quote_text", "method", "source_text", "meaning_prompt", "effect_prompt", "best_themes"],
    optionalFilterFields: [
      { field: "source_text", label: "Text" },
      { field: "method", label: "Method" },
      { field: "level_tag", label: "Level" },
    ],
  },
  {
    key: "character_cards",
    displayName: "Character Cards",
    titleField: "name",
    searchableFields: ["id", "name", "source_text", "one_line"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "name", label: "Character" },
      { field: "source_text", label: "Text" },
      { field: "one_line", label: "Summary", truncate: true },
    ],
    completenessFields: ["name", "source_text", "one_line", "core_function", "structural_role", "themes"],
    optionalFilterFields: [{ field: "source_text", label: "Text" }],
  },
  {
    key: "theme_maps",
    displayName: "Theme Maps",
    titleField: "family",
    searchableFields: ["id", "family", "one_line"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "family", label: "Theme family" },
      { field: "one_line", label: "Concept summary", truncate: true },
    ],
    completenessFields: ["family", "one_line"],
    optionalFilterFields: [{ field: "family", label: "Theme" }],
  },
  {
    key: "symbol_entries",
    displayName: "Symbol / Motif Engine",
    titleField: "name",
    searchableFields: ["id", "name", "source_text", "one_line"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "name", label: "Symbol" },
      { field: "source_text", label: "Text" },
      { field: "one_line", label: "Meaning", truncate: true },
    ],
    completenessFields: ["name", "source_text", "one_line", "themes"],
    optionalFilterFields: [{ field: "source_text", label: "Text" }],
  },
  {
    key: "comparative_matrix",
    displayName: "Comparative Matrix",
    titleField: "axis",
    searchableFields: ["id", "axis", "hard_times", "atonement", "divergence"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "axis", label: "Axis" },
      { field: "hard_times", label: "Hard Times", truncate: true },
      { field: "atonement", label: "Atonement", truncate: true },
    ],
    completenessFields: ["axis", "hard_times", "atonement", "divergence", "themes"],
    optionalFilterFields: [{ field: "axis", label: "Axis" }],
  },
  {
    key: "ao5_tensions",
    displayName: "AO5 Interpretation Engine",
    titleField: "focus",
    searchableFields: ["id", "focus", "dominant_reading", "alternative_reading", "level_tag"],
    previewColumns: [
      { field: "id", label: "ID" },
      { field: "focus", label: "Focus" },
      { field: "dominant_reading", label: "Dominant", truncate: true },
      { field: "alternative_reading", label: "Alternative", truncate: true },
    ],
    completenessFields: ["focus", "dominant_reading", "alternative_reading", "safe_stem", "best_use", "level_tag"],
    optionalFilterFields: [
      { field: "focus", label: "Focus" },
      { field: "level_tag", label: "Level" },
    ],
  },
];

const ROW_LIMIT = 500;

type Row = Record<string, unknown>;
type Completeness = "complete" | "partial" | "sparse";

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function scoreCompleteness(row: Row, fields: string[]): Completeness {
  const effective = fields.length > 0 ? fields : GENERIC_COMPLETENESS_FALLBACK;
  // Only score fields actually present on the row (key exists), so unknown fields don't penalise
  const present = effective.filter((f) => Object.prototype.hasOwnProperty.call(row, f));
  if (present.length === 0) return "sparse";
  const filled = present.filter((f) => isFilled(row[f])).length;
  const ratio = filled / present.length;
  if (ratio >= 0.85) return "complete";
  if (ratio >= 0.5) return "partial";
  return "sparse";
}

function CompletenessBadge({ level }: { level: Completeness }) {
  if (level === "complete") {
    return (
      <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]">
        Complete
      </Badge>
    );
  }
  if (level === "partial") {
    return <Badge variant="outline">Partial</Badge>;
  }
  return <Badge variant="destructive">Sparse</Badge>;
}

function truncateText(v: unknown, max = 90): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.join(", ") || "—";
  const s = typeof v === "string" ? v : String(v);
  if (!s.trim()) return "—";
  return s.length > max ? s.slice(0, max).trim() + "…" : s;
}

function formatFieldValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function toCSV(rows: Row[], columns: PreviewColumn[], completenessFields: string[]): string {
  const head = ["completeness", ...columns.map((c) => c.label)];
  const escape = (s: string) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [head.map(escape).join(",")];
  rows.forEach((r) => {
    const score = scoreCompleteness(r, completenessFields);
    const line = [
      escape(score),
      ...columns.map((c) => escape(formatFieldValue(r[c.field]))),
    ].join(",");
    lines.push(line);
  });
  return lines.join("\n");
}

interface ContentInspectorProps {
  initialTable?: ContentTableKey;
  initialSearch?: string;
  /** Bumped by parent to force re-seed of table/search even if values are unchanged. */
  seedNonce?: number;
}

export default function ContentInspector({ initialTable, initialSearch, seedNonce }: ContentInspectorProps = {}) {
  const [selectedKey, setSelectedKey] = useState<ContentTableKey>(initialTable ?? "questions");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const lastSeedRef = useRef<number | undefined>(seedNonce);

  const config = useMemo(
    () => CONFIGS.find((c) => c.key === selectedKey) ?? CONFIGS[0],
    [selectedKey],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from(selectedKey as never)
      .select("*")
      .limit(ROW_LIMIT);
    if (err) {
      setError(err.message || "Unable to load this table.");
      setRows([]);
    } else {
      setRows((data as unknown as Row[]) ?? []);
    }
    setLastRefreshed(new Date());
    setLoading(false);
  }, [selectedKey]);

  const loadCounts = useCallback(async () => {
    const next: Record<string, number | null> = {};
    await Promise.all(
      CONFIGS.map(async (c) => {
        const { count, error: err } = await supabase
          .from(c.key as never)
          .select("*", { count: "exact", head: true });
        next[c.key] = err ? null : count ?? 0;
      }),
    );
    setCounts(next);
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Reset inspector + filters when switching tables, except on a seed-driven change.
  useEffect(() => {
    setOpenIndex(null);
    setFilters({});
    setShowRawJson(false);
    if (lastSeedRef.current === seedNonce) {
      setSearch("");
    }
  }, [selectedKey, seedNonce]);

  // React to a new seed from the parent (drill-through from Vocabulary tab).
  useEffect(() => {
    if (seedNonce === undefined || lastSeedRef.current === seedNonce) return;
    lastSeedRef.current = seedNonce;
    if (initialTable) setSelectedKey(initialTable);
    setSearch(initialSearch ?? "");
    setFilters({});
    setOpenIndex(null);
  }, [seedNonce, initialTable, initialSearch]);

  // Detect which configured fields actually exist on the loaded rows
  const presentFieldSet = useMemo(() => {
    const set = new Set<string>();
    rows.slice(0, 50).forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return set;
  }, [rows]);

  const activeSearchFields = useMemo(
    () => config.searchableFields.filter((f) => presentFieldSet.has(f) || rows.length === 0),
    [config.searchableFields, presentFieldSet, rows.length],
  );

  const activeFilterFields = useMemo(() => {
    const opts = config.optionalFilterFields ?? [];
    return opts.filter((f) => presentFieldSet.has(f.field));
  }, [config.optionalFilterFields, presentFieldSet]);

  // Build distinct value options per active filter field
  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    activeFilterFields.forEach((f) => {
      const seen = new Set<string>();
      rows.forEach((r) => {
        const v = r[f.field];
        if (v === null || v === undefined) return;
        if (Array.isArray(v)) {
          v.forEach((x) => {
            const s = String(x).trim();
            if (s) seen.add(s);
          });
        } else {
          const s = String(v).trim();
          if (s && s.length <= 60) seen.add(s);
        }
      });
      map[f.field] = Array.from(seen).sort((a, b) => a.localeCompare(b)).slice(0, 50);
    });
    return map;
  }, [rows, activeFilterFields]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      // search
      if (q) {
        const matches = activeSearchFields.some((f) => {
          const v = r[f];
          if (v === null || v === undefined) return false;
          if (Array.isArray(v)) return v.join(" ").toLowerCase().includes(q);
          return String(v).toLowerCase().includes(q);
        });
        if (!matches) return false;
      }
      // filters (exact equality, array contains)
      for (const [field, val] of Object.entries(filters)) {
        if (!val) continue;
        const v = r[field];
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) {
          if (!v.some((x) => String(x) === val)) return false;
        } else if (String(v) !== val) {
          return false;
        }
      }
      return true;
    });
  }, [rows, search, activeSearchFields, filters]);

  const fieldsDetected = presentFieldSet.size;

  const tableCompleteness = useMemo(() => {
    if (rows.length === 0) return { label: "Needs Review" };
    const scores = rows.map((r) => scoreCompleteness(r, config.completenessFields));
    const complete = scores.filter((s) => s === "complete").length;
    const sparse = scores.filter((s) => s === "sparse").length;
    let label = "Strong";
    if (sparse / scores.length > 0.25) label = "Needs Review";
    else if (complete / scores.length < 0.7) label = "Mixed";
    return { label };
  }, [rows, config.completenessFields]);

  const queryStatus: { label: string; tone: "ok" | "warn" | "err" } = error
    ? { label: "Failed", tone: "err" }
    : loading
      ? { label: "Loading", tone: "warn" }
      : { label: "OK", tone: "ok" };

  const openRow = openIndex !== null ? filtered[openIndex] : null;
  const atLimit = rows.length >= ROW_LIMIT;
  const tableCount = counts[selectedKey];
  const mayHaveMore = atLimit && (tableCount === null || tableCount === undefined || tableCount > ROW_LIMIT);

  const handleExport = () => {
    const csv = toCSV(filtered, config.previewColumns, config.completenessFields);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.key}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRecord = async () => {
    if (!openRow) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(openRow, null, 2));
      toast({ title: "Record copied", description: "JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const navigateRecord = (delta: number) => {
    if (openIndex === null) return;
    const next = openIndex + delta;
    if (next >= 0 && next < filtered.length) {
      setOpenIndex(next);
      setShowRawJson(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => !!v).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Content Table Inspector</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect seeded academic content records across the app's live content tables.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Browse, search, and review records for questions, quote banks, themes, AO5 debates, and other academic datasets.
        </p>
      </div>

      {/* Sticky control bar */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Content table
            </label>
            <Select value={selectedKey} onValueChange={(v) => setSelectedKey(v as ContentTableKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIGS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    <span className="flex items-center gap-2">
                      <span>{c.displayName}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {counts[c.key] ?? "—"}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={`Search ${config.displayName.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={loadRows} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export view
          </Button>
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground">
              Last refreshed {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Adaptive filter chips */}
        {activeFilterFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs font-medium text-muted-foreground">Filters:</span>
            {activeFilterFields.map((f) => {
              const opts = filterOptions[f.field] ?? [];
              const value = filters[f.field] ?? "__all__";
              return (
                <Select
                  key={f.field}
                  value={value}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, [f.field]: v === "__all__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All {f.label.toLowerCase()}</SelectItem>
                    {opts.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o.length > 40 ? o.slice(0, 40) + "…" : o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setFilters({})}
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error banner above grid */}
      {error && (
        <div className="border border-destructive/40 bg-destructive/5 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-destructive">
              Unable to load {config.displayName}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{error}</div>
          </div>
          <Button variant="outline" size="sm" onClick={loadRows}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Selected table" value={config.displayName} mono={false} />
        <SummaryCard
          label="Rows"
          value={
            tableCount !== null && tableCount !== undefined && tableCount > rows.length
              ? `${rows.length} / ${tableCount}`
              : String(rows.length)
          }
        />
        <SummaryCard label="Fields" value={String(fieldsDetected)} />
        <SummaryCard label="Completeness" value={tableCompleteness.label} mono={false} />
        <SummaryCard
          label="Query status"
          value={queryStatus.label}
          mono={false}
          tone={queryStatus.tone}
        />
      </div>

      {/* Records grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">{config.displayName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Showing {filtered.length} of {rows.length} loaded records
                {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`}
              </p>
            </div>
          </div>
          {mayHaveMore && (
            <div className="mt-3 border border-border bg-muted/40 rounded-md px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                Showing the first {ROW_LIMIT} records for inspection.
                {tableCount !== null && tableCount !== undefined
                  ? ` This table contains ${tableCount} total rows — ${tableCount - rows.length} are not loaded.`
                  : " The full table may contain additional rows."}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error ? null : loading ? (
            <div className="py-8 text-sm text-muted-foreground text-center">Loading records…</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground text-center border rounded-md">
              No records found for this table.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground text-center border rounded-md">
              No records match the current search.
            </div>
          ) : (
            <div className="overflow-auto max-h-[640px] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    {config.previewColumns.map((c) => (
                      <TableHead key={c.field}>{c.label}</TableHead>
                    ))}
                    <TableHead>Completeness</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, idx) => {
                    const score = scoreCompleteness(row, config.completenessFields);
                    return (
                      <TableRow
                        key={String(row.id ?? idx)}
                        className="cursor-pointer odd:bg-muted/30 hover:bg-muted/60"
                        onClick={() => setOpenIndex(idx)}
                      >
                        {config.previewColumns.map((c) => (
                          <TableCell
                            key={c.field}
                            className={c.field === "id" ? "font-mono text-xs" : "text-sm"}
                          >
                            {c.truncate
                              ? truncateText(row[c.field])
                              : truncateText(row[c.field], 40)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <CompletenessBadge level={score} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenIndex(idx);
                            }}
                          >
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspector drawer (read-only) */}
      <Sheet open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          {openRow && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {config.displayName}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateRecord(-1)}
                      disabled={openIndex === 0}
                      aria-label="Previous record"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {(openIndex ?? 0) + 1} / {filtered.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateRecord(1)}
                      disabled={openIndex === filtered.length - 1}
                      aria-label="Next record"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <SheetTitle className="text-left">
                  {truncateText(openRow[config.titleField], 120)}
                </SheetTitle>
                <SheetDescription className="text-left font-mono text-xs">
                  {String(openRow.id ?? "—")}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-2">
                  <CompletenessBadge level={scoreCompleteness(openRow, config.completenessFields)} />
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(openRow).length} fields
                  </span>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleCopyRecord}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  {isEditableTable(selectedKey) && (
                    <Button
                      size="sm"
                      onClick={() => setEditorOpen(true)}
                    >
                      Edit record
                    </Button>
                  )}
                </div>
                {!isEditableTable(selectedKey) && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Editing is not enabled for this table yet.
                  </p>
                )}
              </SheetHeader>

              <div className="py-4 space-y-3">
                {Object.entries(openRow).map(([field, value]) => {
                  const filled = isFilled(value);
                  return (
                    <div key={field} className="border-b pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {field}
                        </span>
                        {!filled && (
                          <Badge variant="outline" className="text-[10px]">
                            Empty
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {filled ? formatFieldValue(value) : <span className="text-muted-foreground italic">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawJson((v) => !v)}
                >
                  {showRawJson ? "Hide" : "Show"} raw JSON
                </Button>
                {showRawJson && (
                  <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(openRow, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Record editor (only for editable tables) */}
      {openRow && isEditableTable(selectedKey) && (
        <RecordEditor
          open={editorOpen}
          table={selectedKey as EditableTableKey}
          record={openRow}
          onClose={() => setEditorOpen(false)}
          onSaved={(updated) => {
            // Replace row in local state by id
            setRows((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            );
            setEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  mono = true,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "ok" | "warn" | "err";
}) {
  const toneClass =
    tone === "err"
      ? "text-destructive"
      : tone === "warn"
        ? "text-muted-foreground"
        : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${mono ? "text-2xl tabular-nums" : "text-base"} font-semibold ${toneClass}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
