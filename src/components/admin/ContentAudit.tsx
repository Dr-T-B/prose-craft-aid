import { useCallback, useEffect, useMemo, useState } from "react";
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
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RecordEditor, {
  isEditableTable,
  type EditableTableKey,
} from "./RecordEditor";

// --- Types & config ---------------------------------------------------------

type ContentTableKey =
  | "questions"
  | "quote_methods"
  | "ao5_tensions"
  | "theme_maps"
  | "theses"
  | "paragraph_jobs"
  | "character_cards"
  | "symbol_entries"
  | "comparative_matrix"
  | "routes";

interface AuditConfig {
  key: ContentTableKey;
  displayName: string;
  /** Critical fields that must be filled. Missing any → High severity. */
  criticalFields: string[];
  /** Field used as the human-readable preview in findings. */
  previewField: string;
  /** Field combo used to detect duplicates (joined + normalised). */
  duplicateCheckFields: string[];
  /** All text fields that should be scanned for placeholders/noise. */
  auditTextFields: string[];
  /** Total fields used to score sparsity (denominator). */
  expectedFieldCount: number;
  /** True for high-priority tables (audited by default). */
  priority: boolean;
}

const CONFIGS: AuditConfig[] = [
  {
    key: "questions",
    displayName: "Questions Engine",
    criticalFields: ["stem", "family", "level_tag", "primary_route_id"],
    previewField: "stem",
    duplicateCheckFields: ["stem"],
    auditTextFields: ["stem", "family", "level_tag"],
    expectedFieldCount: 6,
    priority: true,
  },
  {
    key: "quote_methods",
    displayName: "Quote + Method Bank",
    criticalFields: ["quote_text", "method", "source_text"],
    previewField: "quote_text",
    duplicateCheckFields: ["quote_text"],
    auditTextFields: ["quote_text", "method", "meaning_prompt", "effect_prompt"],
    expectedFieldCount: 7,
    priority: true,
  },
  {
    key: "ao5_tensions",
    displayName: "AO5 Interpretation Engine",
    criticalFields: ["focus", "dominant_reading", "alternative_reading"],
    previewField: "focus",
    duplicateCheckFields: ["focus"],
    auditTextFields: ["focus", "dominant_reading", "alternative_reading", "safe_stem"],
    expectedFieldCount: 6,
    priority: true,
  },
  {
    key: "theme_maps",
    displayName: "Theme Maps",
    criticalFields: ["family", "one_line"],
    previewField: "family",
    duplicateCheckFields: ["family", "one_line"],
    auditTextFields: ["family", "one_line"],
    expectedFieldCount: 2,
    priority: true,
  },
  {
    key: "theses",
    displayName: "Thesis Builder",
    criticalFields: ["thesis_text", "theme_family", "level", "route_id"],
    previewField: "thesis_text",
    duplicateCheckFields: ["thesis_text"],
    auditTextFields: ["thesis_text", "paragraph_job_1_label", "paragraph_job_2_label"],
    expectedFieldCount: 6,
    priority: false,
  },
  {
    key: "paragraph_jobs",
    displayName: "Paragraph Builder",
    criticalFields: ["job_title", "question_family", "route_id", "judgement_prompt"],
    previewField: "job_title",
    duplicateCheckFields: ["job_title", "route_id"],
    auditTextFields: ["job_title", "text1_prompt", "text2_prompt", "judgement_prompt", "divergence_prompt"],
    expectedFieldCount: 6,
    priority: false,
  },
  {
    key: "character_cards",
    displayName: "Character Cards",
    criticalFields: ["name", "source_text", "one_line"],
    previewField: "name",
    duplicateCheckFields: ["name", "source_text"],
    auditTextFields: ["name", "one_line", "core_function", "structural_role", "complication"],
    expectedFieldCount: 6,
    priority: false,
  },
  {
    key: "symbol_entries",
    displayName: "Symbol / Motif Engine",
    criticalFields: ["name", "source_text", "one_line"],
    previewField: "name",
    duplicateCheckFields: ["name", "source_text"],
    auditTextFields: ["name", "one_line"],
    expectedFieldCount: 4,
    priority: false,
  },
  {
    key: "comparative_matrix",
    displayName: "Comparative Matrix",
    criticalFields: ["axis", "hard_times", "atonement"],
    previewField: "axis",
    duplicateCheckFields: ["axis"],
    auditTextFields: ["axis", "hard_times", "atonement", "divergence"],
    expectedFieldCount: 5,
    priority: false,
  },
  {
    key: "routes",
    displayName: "Routes",
    criticalFields: ["name", "core_question", "best_use"],
    previewField: "name",
    duplicateCheckFields: ["name"],
    auditTextFields: ["name", "core_question", "atonement_emphasis", "hard_times_emphasis", "best_use"],
    expectedFieldCount: 7,
    priority: false,
  },
];

const PLACEHOLDER_TOKENS = [
  "test",
  "todo",
  "tbc",
  "tbd",
  "lorem",
  "n/a",
  "na",
  "placeholder",
  "sample",
  "draft",
  "xxx",
  "—",
  "...",
];

const SHORT_TEXT_THRESHOLD = 8; // chars
const OVERLONG_THRESHOLD = 1500; // chars

type IssueType =
  | "missing_critical"
  | "sparse"
  | "duplicate"
  | "placeholder"
  | "malformed"
  | "low_signal";

type Severity = "high" | "medium" | "low";

interface Finding {
  id: string;
  table: ContentTableKey;
  tableLabel: string;
  recordId: string;
  preview: string;
  issueType: IssueType;
  severity: Severity;
  reason: string;
  suggestedReview: string;
  sourceRecord: Record<string, unknown>;
  flaggedFields: string[];
}

const ISSUE_LABEL: Record<IssueType, string> = {
  missing_critical: "Missing critical field",
  sparse: "Sparse record",
  duplicate: "Duplicate candidate",
  placeholder: "Placeholder text",
  malformed: "Malformed field",
  low_signal: "Low-signal content",
};

const SUGGESTED_REVIEW: Record<IssueType, string> = {
  missing_critical: "Check source entry and populate missing fields",
  sparse: "Enrich record with the remaining expected fields",
  duplicate: "Compare against adjacent records for duplication",
  placeholder: "Replace placeholder text with final academic content",
  malformed: "Review formatting and field mapping",
  low_signal: "Strengthen content with substantive academic detail",
};

// --- Helpers ----------------------------------------------------------------

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(" ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function normaliseForDup(v: unknown): string {
  return asText(v).toLowerCase().replace(/\s+/g, " ").trim();
}

function isPlaceholder(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (t.length <= 6 && PLACEHOLDER_TOKENS.includes(t)) return true;
  // word-boundary check for short tokens inside short strings
  if (t.length < 60) {
    return PLACEHOLDER_TOKENS.some((tok) => {
      const re = new RegExp(`(^|[^a-z])${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`);
      return re.test(t);
    });
  }
  return false;
}

function isMalformed(text: string): boolean {
  if (!text) return false;
  if (text.length > OVERLONG_THRESHOLD) return true;
  if (/[\|·]{4,}/.test(text)) return true;
  if (/(\n\s*){4,}/.test(text)) return true;
  if (/^[\s\W]+$/.test(text) && text.length > 4) return true;
  // broken JSON-ish fragments in plain text
  if (/[{[][^{}\[\]]{0,40}["'][^{}\[\]]{0,40}["']\s*:/.test(text) && !text.trim().startsWith("{")) return true;
  return false;
}

function truncate(v: unknown, max = 100): string {
  const s = asText(v);
  if (!s.trim()) return "—";
  return s.length > max ? s.slice(0, max).trim() + "…" : s;
}

// --- Audit engine -----------------------------------------------------------

function auditTable(
  cfg: AuditConfig,
  rows: Record<string, unknown>[],
): Finding[] {
  const findings: Finding[] = [];
  if (rows.length === 0) return findings;

  // 1. Build duplicate signature map
  const sigMap = new Map<string, { ids: string[]; rows: Record<string, unknown>[] }>();
  rows.forEach((r) => {
    const present = cfg.duplicateCheckFields.filter((f) =>
      Object.prototype.hasOwnProperty.call(r, f),
    );
    if (present.length === 0) return;
    const sig = present.map((f) => normaliseForDup(r[f])).join("||");
    if (!sig.replace(/\|/g, "").trim()) return;
    const entry = sigMap.get(sig) ?? { ids: [], rows: [] };
    entry.ids.push(String(r.id ?? ""));
    entry.rows.push(r);
    sigMap.set(sig, entry);
  });

  rows.forEach((row, idx) => {
    const recordId = String(row.id ?? `row-${idx}`);
    const preview = truncate(row[cfg.previewField] ?? row.id, 110);

    const push = (
      issueType: IssueType,
      severity: Severity,
      reason: string,
      flaggedFields: string[],
    ) => {
      findings.push({
        id: `${cfg.key}:${recordId}:${issueType}:${flaggedFields.join(",") || "_"}`,
        table: cfg.key,
        tableLabel: cfg.displayName,
        recordId,
        preview,
        issueType,
        severity,
        reason,
        suggestedReview: SUGGESTED_REVIEW[issueType],
        sourceRecord: row,
        flaggedFields,
      });
    };

    // a) Missing critical fields
    const missingCritical = cfg.criticalFields.filter(
      (f) => Object.prototype.hasOwnProperty.call(row, f) && !isFilled(row[f]),
    );
    if (missingCritical.length > 0) {
      const severity: Severity = cfg.priority ? "high" : "medium";
      push(
        "missing_critical",
        severity,
        `Missing ${missingCritical.length === 1 ? "critical field" : "critical fields"}: ${missingCritical.join(", ")}`,
        missingCritical,
      );
    }

    // b) Sparsity
    const presentExpected = cfg.criticalFields.filter((f) =>
      Object.prototype.hasOwnProperty.call(row, f),
    );
    const filled = presentExpected.filter((f) => isFilled(row[f])).length;
    const denom = Math.max(cfg.expectedFieldCount, presentExpected.length);
    const ratio = denom > 0 ? filled / denom : 1;
    if (ratio < 0.34) {
      push(
        "sparse",
        cfg.priority ? "high" : "medium",
        `Sparse record: only ${filled} of ${denom} expected fields populated`,
        [],
      );
    } else if (ratio < 0.6 && missingCritical.length === 0) {
      push("sparse", "low", `Mild sparsity: ${filled} of ${denom} expected fields populated`, []);
    }

    // c) Placeholder text
    const placeholderFields: string[] = [];
    cfg.auditTextFields.forEach((f) => {
      if (!Object.prototype.hasOwnProperty.call(row, f)) return;
      const text = asText(row[f]);
      if (text && isPlaceholder(text)) placeholderFields.push(f);
    });
    if (placeholderFields.length > 0) {
      push(
        "placeholder",
        "medium",
        `Placeholder text detected in ${placeholderFields.join(", ")}`,
        placeholderFields,
      );
    }

    // d) Malformed / noisy text
    const malformedFields: string[] = [];
    cfg.auditTextFields.forEach((f) => {
      if (!Object.prototype.hasOwnProperty.call(row, f)) return;
      const text = asText(row[f]);
      if (text && isMalformed(text)) malformedFields.push(f);
    });
    if (malformedFields.length > 0) {
      push(
        "malformed",
        "medium",
        `Possible formatting issue in ${malformedFields.join(", ")}`,
        malformedFields,
      );
    }

    // e) Low-signal: critical text fields exist but are extremely short
    const lowSignalFields = cfg.criticalFields.filter((f) => {
      if (!Object.prototype.hasOwnProperty.call(row, f)) return false;
      const text = asText(row[f]).trim();
      if (!text) return false;
      // single-word or ultra-short on a content field
      if (text.length < SHORT_TEXT_THRESHOLD) return true;
      return false;
    });
    if (lowSignalFields.length > 0 && missingCritical.length === 0) {
      push(
        "low_signal",
        "low",
        `Very short content in ${lowSignalFields.join(", ")}`,
        lowSignalFields,
      );
    }
  });

  // f) Duplicates (one finding per duplicate row, severity by priority)
  sigMap.forEach((entry) => {
    if (entry.ids.length < 2) return;
    entry.rows.forEach((row, idx) => {
      const recordId = String(row.id ?? `dup-${idx}`);
      const preview = truncate(row[cfg.previewField] ?? row.id, 110);
      const others = entry.ids.filter((x) => x !== recordId).slice(0, 3).join(", ");
      findings.push({
        id: `${cfg.key}:${recordId}:duplicate`,
        table: cfg.key,
        tableLabel: cfg.displayName,
        recordId,
        preview,
        issueType: "duplicate",
        severity: cfg.priority ? "high" : "medium",
        reason: `Duplicate candidate: matches ${entry.ids.length - 1} other record(s) on ${cfg.duplicateCheckFields.join(" + ")}${others ? ` (e.g. ${others})` : ""}`,
        suggestedReview: SUGGESTED_REVIEW.duplicate,
        sourceRecord: row,
        flaggedFields: cfg.duplicateCheckFields,
      });
    });
  });

  return findings;
}

// --- Badges -----------------------------------------------------------------

function SeverityBadge({ level }: { level: Severity }) {
  if (level === "high") return <Badge variant="destructive">High</Badge>;
  if (level === "medium")
    return (
      <Badge className="bg-[hsl(var(--warning,38_92%_50%))] text-[hsl(var(--warning-foreground,0_0%_100%))] hover:bg-[hsl(var(--warning,38_92%_50%))]">
        Medium
      </Badge>
    );
  return <Badge variant="outline">Low</Badge>;
}

function IssueTypeBadge({ type }: { type: IssueType }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {ISSUE_LABEL[type]}
    </Badge>
  );
}

// --- CSV --------------------------------------------------------------------

function findingsToCSV(findings: Finding[]): string {
  const head = ["table", "record_id", "preview", "issue_type", "severity", "reason", "suggested_review"];
  const escape = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [head.join(",")];
  findings.forEach((f) => {
    lines.push(
      [
        f.tableLabel,
        f.recordId,
        f.preview,
        ISSUE_LABEL[f.issueType],
        f.severity,
        f.reason,
        f.suggestedReview,
      ]
        .map(asText)
        .map(escape)
        .join(","),
    );
  });
  return lines.join("\n");
}

// --- Component --------------------------------------------------------------

type ScopeKey = "__priority__" | ContentTableKey;

const ROW_LIMIT = 500;

export default function ContentAudit() {
  const [scope, setScope] = useState<ScopeKey>("__priority__");
  const [severityFilter, setSeverityFilter] = useState<string>("__all__");
  const [issueFilter, setIssueFilter] = useState<string>("__all__");
  const [tableFilter, setTableFilter] = useState<string>("__all__");
  const [search, setSearch] = useState("");

  const [findings, setFindings] = useState<Finding[]>([]);
  const [tablesScanned, setTablesScanned] = useState<string[]>([]);
  const [recordsScanned, setRecordsScanned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableErrors, setTableErrors] = useState<Record<string, string>>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [openFinding, setOpenFinding] = useState<Finding | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const targetConfigs = useMemo(() => {
    if (scope === "__priority__") return CONFIGS.filter((c) => c.priority);
    return CONFIGS.filter((c) => c.key === scope);
  }, [scope]);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTableErrors({});
    const allFindings: Finding[] = [];
    const scanned: string[] = [];
    let totalRecords = 0;
    const errs: Record<string, string> = {};

    await Promise.all(
      targetConfigs.map(async (cfg) => {
        const { data, error: err } = await supabase
          .from(cfg.key as never)
          .select("*")
          .limit(ROW_LIMIT);
        if (err) {
          errs[cfg.key] = err.message || "Query failed";
          return;
        }
        const rows = (data as unknown as Record<string, unknown>[]) ?? [];
        scanned.push(cfg.displayName);
        totalRecords += rows.length;
        const tableFindings = auditTable(cfg, rows);
        allFindings.push(...tableFindings);
      }),
    );

    setFindings(allFindings);
    setTablesScanned(scanned);
    setRecordsScanned(totalRecords);
    setTableErrors(errs);
    if (Object.keys(errs).length > 0 && scanned.length === 0) {
      setError("All audit queries failed. Review permissions and connectivity.");
    }
    setLastRefreshed(new Date());
    setLoading(false);
  }, [targetConfigs]);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  // Reset filters on scope change
  useEffect(() => {
    setSeverityFilter("__all__");
    setIssueFilter("__all__");
    setTableFilter("__all__");
    setSearch("");
    setOpenFinding(null);
  }, [scope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return findings.filter((f) => {
      if (severityFilter !== "__all__" && f.severity !== severityFilter) return false;
      if (issueFilter !== "__all__" && f.issueType !== issueFilter) return false;
      if (tableFilter !== "__all__" && f.table !== tableFilter) return false;
      if (q) {
        const hay = `${f.preview} ${f.reason} ${f.recordId} ${f.tableLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [findings, severityFilter, issueFilter, tableFilter, search]);

  const counts = useMemo(() => {
    const high = findings.filter((f) => f.severity === "high").length;
    const dup = findings.filter((f) => f.issueType === "duplicate").length;
    const sparse = findings.filter((f) => f.issueType === "sparse").length;
    return { high, dup, sparse };
  }, [findings]);

  const handleExport = () => {
    const csv = findingsToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRecord = async () => {
    if (!openFinding) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(openFinding.sourceRecord, null, 2));
      toast({ title: "Record copied", description: "JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const activeFilterCount =
    (severityFilter !== "__all__" ? 1 : 0) +
    (issueFilter !== "__all__" ? 1 : 0) +
    (tableFilter !== "__all__" ? 1 : 0);

  const tableErrorEntries = Object.entries(tableErrors);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Record Quality Audit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review academic content quality across seeded tables.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Identify sparse, duplicated, malformed, or incomplete records before using them in the live student experience.
        </p>
      </div>

      {/* Sticky control bar */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scope</label>
            <Select value={scope} onValueChange={(v) => setScope(v as ScopeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__priority__">Priority tables</SelectItem>
                {CONFIGS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search reason, preview, id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={runAudit} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Re-run audit
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

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-medium text-muted-foreground">Filters:</span>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={issueFilter} onValueChange={setIssueFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs">
              <SelectValue placeholder="Issue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All issue types</SelectItem>
              {(Object.keys(ISSUE_LABEL) as IssueType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ISSUE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {scope === "__priority__" && (
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All audited tables</SelectItem>
                {targetConfigs.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSeverityFilter("__all__");
                setIssueFilter("__all__");
                setTableFilter("__all__");
              }}
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="border border-destructive/40 bg-destructive/5 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-destructive">Audit failed</div>
            <div className="text-xs text-muted-foreground mt-0.5">{error}</div>
          </div>
          <Button variant="outline" size="sm" onClick={runAudit}>
            Retry
          </Button>
        </div>
      )}

      {/* Per-table query failures */}
      {tableErrorEntries.length > 0 && !error && (
        <div className="border border-border bg-muted/40 rounded-md p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Some tables could not be audited
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-6 list-disc">
            {tableErrorEntries.map(([k, msg]) => (
              <li key={k}>
                <span className="font-medium">{CONFIGS.find((c) => c.key === k)?.displayName ?? k}:</span> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Tables audited" value={String(tablesScanned.length)} />
        <Kpi label="Records scanned" value={String(recordsScanned)} />
        <Kpi label="Issues found" value={String(findings.length)} />
        <Kpi label="High severity" value={String(counts.high)} tone={counts.high > 0 ? "err" : "ok"} />
        <Kpi label="Duplicate candidates" value={String(counts.dup)} />
        <Kpi label="Sparse records" value={String(counts.sparse)} />
      </div>

      {/* Findings table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">Audit findings</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Showing {filtered.length} of {findings.length} findings
                {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground text-center">Running audit…</div>
          ) : findings.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground text-center border rounded-md">
              No audit issues found in the current selection.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground text-center border rounded-md">
              No findings match the current filters.
            </div>
          ) : (
            <div className="overflow-auto max-h-[640px] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Suggested review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow
                      key={f.id}
                      className="cursor-pointer odd:bg-muted/30 hover:bg-muted/60"
                      onClick={() => {
                        setOpenFinding(f);
                        setShowRawJson(false);
                      }}
                    >
                      <TableCell className="text-sm">{f.tableLabel}</TableCell>
                      <TableCell className="font-mono text-xs">{f.recordId}</TableCell>
                      <TableCell className="text-sm max-w-[260px]">
                        <span className="line-clamp-2">{f.preview}</span>
                      </TableCell>
                      <TableCell>
                        <IssueTypeBadge type={f.issueType} />
                      </TableCell>
                      <TableCell>
                        <SeverityBadge level={f.severity} />
                      </TableCell>
                      <TableCell className="text-sm max-w-[280px]">
                        <span className="line-clamp-2">{f.reason}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                        <span className="line-clamp-2">{f.suggestedReview}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={openFinding !== null} onOpenChange={(o) => !o && setOpenFinding(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          {openFinding && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {openFinding.tableLabel}
                  </Badge>
                  <SeverityBadge level={openFinding.severity} />
                </div>
                <SheetTitle className="text-left">{openFinding.preview}</SheetTitle>
                <SheetDescription className="text-left font-mono text-xs">
                  {openFinding.recordId}
                </SheetDescription>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <IssueTypeBadge type={openFinding.issueType} />
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(openFinding.sourceRecord).length} fields
                  </span>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleCopyRecord}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  {isEditableTable(openFinding.table) && (
                    <Button size="sm" onClick={() => setEditorOpen(true)}>
                      Edit record
                    </Button>
                  )}
                </div>
                {!isEditableTable(openFinding.table) && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Editing is not enabled for this table yet.
                  </p>
                )}
              </SheetHeader>

              <div className="py-4 space-y-4">
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Reason
                  </div>
                  <div className="text-sm">{openFinding.reason}</div>
                </div>
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Suggested review
                  </div>
                  <div className="text-sm">{openFinding.suggestedReview}</div>
                </div>

                {openFinding.flaggedFields.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Flagged fields
                    </div>
                    <div className="space-y-2">
                      {openFinding.flaggedFields.map((f) => (
                        <div key={f} className="border rounded-md p-3 border-destructive/30">
                          <div className="text-xs font-mono text-muted-foreground mb-1">{f}</div>
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {isFilled(openFinding.sourceRecord[f]) ? (
                              asText(openFinding.sourceRecord[f])
                            ) : (
                              <span className="italic text-muted-foreground">empty</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Full record
                  </div>
                  <div className="space-y-2">
                    {Object.entries(openFinding.sourceRecord).map(([field, value]) => {
                      const filled = isFilled(value);
                      return (
                        <div key={field} className="border-b pb-2 last:border-0">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                            {field}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {filled ? (
                              asText(value)
                            ) : (
                              <span className="italic text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowRawJson((v) => !v)}>
                    {showRawJson ? "Hide" : "Show"} raw JSON
                  </Button>
                  {showRawJson && (
                    <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(openFinding.sourceRecord, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "err";
}) {
  const toneClass = tone === "err" ? "text-destructive" : "";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
