// Review Queue — v1 governance surface for staged changes.
//
// Compact field-level diff model: each proposal targets a single record and
// (for v1) a single field. Approval invokes the apply-staged-change edge
// function which uses the service role to validate (whitelist + optimistic
// concurrency) and apply the patch atomically. Reject only updates proposal
// status; the live record is never mutated.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Search,
  ArrowRight,
} from "lucide-react";

interface StagedChange {
  id: string;
  proposal_type: "normalization" | "edit" | string;
  target_table: string;
  target_record_id: string;
  changed_fields: string[];
  original_snapshot: Record<string, unknown>;
  proposed_patch: Record<string, unknown>;
  operation?: "insert" | "update" | "upsert" | "delete" | string | null;
  normalized_payload?: Record<string, unknown> | null;
  source_payload?: Record<string, unknown> | null;
  validation_status?: "pending" | "valid" | "warning" | "invalid" | string | null;
  validation_errors?: unknown[] | null;
  applied_at?: string | null;
  source_row_number?: number | null;
  import_log_id?: string | null;
  content_hash?: string | null;
  dedupe_key?: string | null;
  source_surface: string | null;
  source_finding_id: string | null;
  source_issue_type: string | null;
  note: string | null;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "applied"
    | "failed"
    | "cancelled";
  apply_error: string | null;
  proposed_by: string | null;
  proposed_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Per-table preview field. Used purely for reviewer orientation in the queue
// row + detail panel — never written to and never part of the diff.
const PREVIEW_FIELDS: Record<string, string[]> = {
  questions: ["stem"],
  quote_methods: ["quote_text", "source_text"],
  theme_maps: ["family", "one_line"],
  ao5_tensions: ["focus", "dominant_reading"],
  theses: ["thesis_text"],
  paragraph_jobs: ["job_title"],
  character_cards: ["name", "one_line"],
  symbol_entries: ["name", "one_line"],
  comparative_matrix: ["axis"],
  routes: ["name", "core_question"],
};

const TIER1_LIBRARY_TABLES = new Set([
  "library_quotes",
  "library_questions",
  "library_comparative_pairings",
  "library_thesis_bank",
  "library_paragraph_frames",
  "library_context_bank",
]);

const TIER1_PRIMARY_FIELDS: Record<string, string[]> = {
  library_quotes: ["quote_text"],
  library_questions: ["question_text"],
  library_comparative_pairings: ["comparison_focus", "quote_a", "quote_b"],
  library_thesis_bank: ["thesis_text"],
  library_paragraph_frames: ["frame_title", "frame_text"],
  library_context_bank: ["context_title", "context_point"],
};

function truncate(s: string, n = 80): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function formatValue(v: unknown): string {
  if (v == null) return "(empty)";
  if (Array.isArray(v)) {
    if (v.length === 0) return "[ ]";
    return "[ " + v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ") + " ]";
  }
  if (typeof v === "string") return v === "" ? "(empty string)" : v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function statusVariant(s: StagedChange["status"]) {
  if (s === "applied") return "default" as const;
  if (s === "rejected" || s === "cancelled") return "secondary" as const;
  if (s === "failed") return "destructive" as const;
  return "outline" as const;
}

function isTier1LibraryChange(p: StagedChange): boolean {
  return TIER1_LIBRARY_TABLES.has(p.target_table);
}

function payloadFor(p: StagedChange): Record<string, unknown> {
  return p.normalized_payload && typeof p.normalized_payload === "object"
    ? p.normalized_payload
    : p.proposed_patch ?? {};
}

function shortId(value: unknown, length = 18): string {
  if (value == null || value === "") return "—";
  return truncate(String(value), length);
}

function validationVariant(status: string | null | undefined) {
  if (status === "invalid") return "destructive" as const;
  if (status === "valid") return "default" as const;
  return "outline" as const;
}

function renderTier1Preview(p: StagedChange): string | null {
  const payload = payloadFor(p);
  const fields = TIER1_PRIMARY_FIELDS[p.target_table] ?? [];
  const values = fields
    .map((field) => payload[field])
    .filter((value) => value != null && value !== "")
    .map((value) => formatValue(value));
  if (values.length === 0) return null;
  return truncate(values.join(" · "), 140);
}

function issueSummary(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return value
    .map((issue) => {
      if (!issue || typeof issue !== "object") return formatValue(issue);
      const record = issue as Record<string, unknown>;
      return [record.field, record.message].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join("; ");
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

interface ReviewQueueProps {
  /** Drill-through seed: applied (overriding defaults) when seedNonce changes. */
  seedNonce?: number;
  initialStatus?: string;
  initialTable?: string;
  initialSearch?: string;
}

export default function ReviewQueue({
  seedNonce,
  initialStatus,
  initialTable,
  initialSearch,
}: ReviewQueueProps = {}) {
  const [items, setItems] = useState<StagedChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState(initialSearch ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? "pending");
  const [tableFilter, setTableFilter] = useState<string>(initialTable ?? "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewerNote, setReviewerNote] = useState("");
  const [previewRow, setPreviewRow] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staged_changes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      toast({
        title: "Failed to load proposals",
        description: error.message,
        variant: "destructive",
      });
      setItems([]);
    } else {
      setItems((data ?? []) as unknown as StagedChange[]);
    }
    setLastRefreshed(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Drill-through seed: re-applies filters when seedNonce changes.
  // Use refs to avoid re-running when initial* props change outside of seedNonce updates.
  const initialStatusRef = useRef(initialStatus);
  const initialTableRef = useRef(initialTable);
  const initialSearchRef = useRef(initialSearch);
  initialStatusRef.current = initialStatus;
  initialTableRef.current = initialTable;
  initialSearchRef.current = initialSearch;

  useEffect(() => {
    if (seedNonce === undefined || seedNonce === 0) return;
    setStatusFilter(initialStatusRef.current ?? "pending");
    setTableFilter(initialTableRef.current ?? "all");
    setSearch(initialSearchRef.current ?? "");
    setTypeFilter("all");
    setSelectedId(null);
  }, [seedNonce]);

  // Tables present in the current dataset (for the table filter dropdown).
  const availableTables = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => set.add(p.target_table));
    return Array.from(set).sort();
  }, [items]);

  // Apply filters + search.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (tableFilter !== "all" && p.target_table !== tableFilter) return false;
      if (typeFilter !== "all" && p.proposal_type !== typeFilter) return false;
      if (!q) return true;
      const field = p.changed_fields[0] ?? "";
      const previewFields = PREVIEW_FIELDS[p.target_table] ?? [];
      const previewBits = previewFields
        .map((f) => formatValue(p.original_snapshot?.[f]))
        .join(" ");
      const tier1Payload = payloadFor(p);
      const haystack = [
        p.target_table,
        p.target_record_id,
        field,
        previewBits,
        renderTier1Preview(p) ?? "",
        p.operation ?? "",
        p.validation_status ?? "",
        p.content_hash ?? "",
        p.dedupe_key ?? "",
        p.import_log_id ?? "",
        p.source_row_number ?? "",
        p.source_issue_type ?? "",
        p.source_surface ?? "",
        p.note ?? "",
        formatValue(p.original_snapshot?.[field]),
        formatValue(p.proposed_patch?.[field]),
        formatValue(tier1Payload),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, statusFilter, tableFilter, typeFilter, search]);

  // KPIs across the full dataset (not the filtered slice — they're a global
  // pulse of the queue, independent of current filter state).
  const kpis = useMemo(() => {
    let pending = 0;
    let approvedToday = 0;
    let rejectedToday = 0;
    let appliedToday = 0;
    const tables = new Set<string>();
    items.forEach((p) => {
      if (p.status === "pending") pending++;
      tables.add(p.target_table);
      if (p.reviewed_at && isToday(p.reviewed_at)) {
        if (p.status === "approved") approvedToday++;
        if (p.status === "rejected") rejectedToday++;
        if (p.status === "applied") appliedToday++;
      }
    });
    return {
      pending,
      approvedToday,
      rejectedToday,
      appliedToday,
      tables: tables.size,
    };
  }, [items]);

  const selected = useMemo(
    () => items.find((p) => p.id === selectedId) ?? null,
    [items, selectedId],
  );

  // Load a short preview row for orientation when a proposal is selected.
  // We only fetch the configured PREVIEW_FIELDS (no full record).
  useEffect(() => {
    if (!selected) {
      setPreviewRow(null);
      return;
    }
    setReviewerNote(selected.note ?? "");
    if (isTier1LibraryChange(selected)) {
      setPreviewRow(null);
      return;
    }
    const fields = PREVIEW_FIELDS[selected.target_table];
    if (!fields || fields.length === 0) {
      setPreviewRow(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from(selected.target_table as never)
        .select(["id", ...fields].join(", "))
        .eq("id", selected.target_record_id)
        .maybeSingle();
      if (!cancelled) {
        setPreviewRow(error ? null : ((data as Record<string, unknown> | null) ?? null));
        setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const handleApprove = async (p: StagedChange) => {
    setActingId(p.id);
    // Persist reviewer note before applying so it survives the status change.
    if (reviewerNote && reviewerNote !== (p.note ?? "")) {
      await supabase.from("staged_changes").update({ note: reviewerNote }).eq("id", p.id);
    }
    const { data, error } = await supabase.functions.invoke("apply-staged-change", {
      body: { staged_change_id: p.id },
    });
    setActingId(null);
    if (error) {
      const msg = (data as { error?: string } | null)?.error ?? error.message;
      toast({ title: "Approval failed", description: msg, variant: "destructive" });
    } else {
      const field = p.changed_fields[0] ?? "field";
      toast({
        title: "Change applied",
        description: `${p.target_table} · ${field} updated.`,
      });
    }
    load();
  };

  const handleReject = async (p: StagedChange) => {
    setActingId(p.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("staged_changes")
      .update({
        status: "rejected",
        note: reviewerNote || p.note,
        reviewed_by: userData.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    setActingId(null);
    if (error) {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal rejected" });
    }
    load();
  };

  const renderShortPreview = (p: StagedChange) => {
    if (isTier1LibraryChange(p)) return renderTier1Preview(p);
    const fields = PREVIEW_FIELDS[p.target_table];
    if (!fields || fields.length === 0) return null;
    const parts = fields
      .map((f) => p.original_snapshot?.[f])
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    if (parts.length === 0) return null;
    return truncate(parts.join(" · "), 70);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Review queue</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve staged changes before they update live academic content.
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Use this queue to inspect proposed changes, compare before / after values, and apply approved updates through a governed workflow. Approval is applied server-side with field whitelisting and stale-snapshot protection.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold tabular-nums">{kpis.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Approved today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold tabular-nums">{kpis.approvedToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Rejected today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold tabular-nums">{kpis.rejectedToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Applied today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold tabular-nums">{kpis.appliedToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Tables affected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold tabular-nums">{kpis.tables}</div></CardContent>
        </Card>
      </div>

      {/* Control bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Table, record id, field, preview, issue, note…"
                  className="pl-7 h-9"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">Table</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  {availableTables.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-1">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="normalization">Normalization</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {lastRefreshed && (
                <span className="text-[11px] text-muted-foreground">
                  Refreshed {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              <Button size="sm" variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue grid + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {filtered.length} {filtered.length === 1 ? "proposal" : "proposals"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No proposals match the current filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[110px]">Type</TableHead>
                    <TableHead>Table · Field</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Import</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-[120px]">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const field = p.changed_fields[0] ?? "—";
                    const isSelected = p.id === selectedId;
                    const preview = renderShortPreview(p);
                    const isTier1 = isTier1LibraryChange(p);
                    return (
                      <TableRow
                        key={p.id}
                        tabIndex={0}
                        data-state={isSelected ? "selected" : undefined}
                        onClick={() => setSelectedId(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(p.id);
                          }
                        }}
                        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <TableCell>
                          <Badge variant={statusVariant(p.status)} className="text-[10px]">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {p.proposal_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{p.target_table}</div>
                          <div className="text-xs text-muted-foreground">
                            {isTier1 ? p.operation ?? "upsert" : field}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[11px] text-muted-foreground break-all">
                            {truncate(p.target_record_id, 22)}
                          </code>
                        </TableCell>
                        <TableCell>
                          {isTier1 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant={validationVariant(p.validation_status)} className="text-[10px] px-1.5 py-0">
                                  {p.validation_status ?? "pending"}
                                </Badge>
                                {p.source_row_number != null && (
                                  <span className="text-[11px] text-muted-foreground tabular-nums">
                                    row {p.source_row_number}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {shortId(p.content_hash, 16)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground max-w-[320px] truncate">
                            {preview ?? <span className="italic">—</span>}
                          </div>
                          {isTier1 && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              dedupe {shortId(p.dedupe_key, 18)} · log {shortId(p.import_log_id, 12)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card className="lg:col-span-1 self-start sticky top-4">
          <CardHeader>
            <CardTitle className="text-base">Proposal detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select a proposal to inspect the field-level diff.
              </p>
            ) : (
              <DetailPanel
                p={selected}
                previewRow={previewRow}
                previewLoading={previewLoading}
                reviewerNote={reviewerNote}
                onReviewerNoteChange={setReviewerNote}
                onApprove={() => handleApprove(selected)}
                onReject={() => handleReject(selected)}
                acting={actingId === selected.id}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------- Detail panel ---------------------------------------------------

interface DetailPanelProps {
  p: StagedChange;
  previewRow: Record<string, unknown> | null;
  previewLoading: boolean;
  reviewerNote: string;
  onReviewerNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  acting: boolean;
}

function InfoPill({
  label,
  value,
  variant = "outline",
}: {
  label: string;
  value: unknown;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-2 min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      <Badge variant={variant} className="max-w-full text-[10px] font-mono">
        <span className="truncate">{formatValue(value)}</span>
      </Badge>
    </div>
  );
}

function ValueCell({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[ ]</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <Badge key={`${String(item)}-${index}`} variant="secondary" className="text-[10px]">
            {formatValue(item)}
          </Badge>
        ))}
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <details>
        <summary className="cursor-pointer text-muted-foreground">View JSON</summary>
        <pre className="mt-2 max-h-44 overflow-auto rounded bg-muted p-2 text-[11px] whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  }
  return <span className="break-words">{formatValue(value)}</span>;
}

function PayloadTable({
  title,
  payload,
}: {
  title: string;
  payload: Record<string, unknown> | null | undefined;
}) {
  const entries = Object.entries(payload ?? {});
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableBody>
            {entries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="w-32 align-top py-2">
                  <code className="text-[11px]">{key}</code>
                </TableCell>
                <TableCell className="align-top py-2 text-xs">
                  <ValueCell value={value} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Tier1ImportDetail({
  p,
  payload,
}: {
  p: StagedChange;
  payload: Record<string, unknown>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Primary preview
        </div>
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          {renderTier1Preview(p) ?? "No primary content found."}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Validation notes
        </div>
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          {issueSummary(p.validation_errors) === "—" ? (
            <span className="text-muted-foreground">No validation errors or warnings.</span>
          ) : (
            issueSummary(p.validation_errors)
          )}
        </div>
      </div>

      <PayloadTable title="Normalized payload" payload={payload} />
      {p.normalized_payload ? null : (
        <PayloadTable title="Proposed patch fallback" payload={p.proposed_patch} />
      )}
      <PayloadTable title="Source payload" payload={p.source_payload} />
    </div>
  );
}

function DetailPanel({
  p,
  previewRow,
  previewLoading,
  reviewerNote,
  onReviewerNoteChange,
  onApprove,
  onReject,
  acting,
}: DetailPanelProps) {
  // v1: single field per proposal — take the first (and only) entry.
  const field = p.changed_fields[0] ?? "";
  const before = p.original_snapshot?.[field];
  const after = p.proposed_patch?.[field];
  const previewFields = PREVIEW_FIELDS[p.target_table] ?? [];
  const isTier1 = isTier1LibraryChange(p);
  const tier1Payload = payloadFor(p);

  const isPending = p.status === "pending";
  const canApply = isPending && !(isTier1 && p.validation_status === "invalid");

  return (
    <div className="space-y-4 text-sm">
      {/* Identity */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant(p.status)} className="text-[10px]">{p.status}</Badge>
          <Badge variant="outline" className="text-[10px]">{p.proposal_type}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{p.target_table}</span>
          <span className="mx-1">·</span>
          <span>{isTier1 ? p.operation ?? "upsert" : field}</span>
        </div>
        <code className="text-[11px] text-muted-foreground break-all block">
          {p.target_record_id}
        </code>
      </div>

      {isTier1 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoPill label="Validation" value={p.validation_status ?? "pending"} variant={validationVariant(p.validation_status)} />
          <InfoPill label="Source row" value={p.source_row_number ?? "—"} />
          <InfoPill label="Content hash" value={shortId(p.content_hash, 28)} />
          <InfoPill label="Dedupe key" value={shortId(p.dedupe_key, 28)} />
          <InfoPill label="Import log" value={shortId(p.import_log_id, 28)} />
          <InfoPill label="Operation" value={p.operation ?? "upsert"} />
        </div>
      )}

      {/* Short record preview */}
      {!isTier1 && previewFields.length > 0 && (
        <div className="space-y-1 border-l-2 border-border pl-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Record preview
          </div>
          {previewLoading ? (
            <div className="text-xs text-muted-foreground italic">Loading…</div>
          ) : previewRow ? (
            previewFields.map((f) => {
              const v = previewRow[f];
              if (v == null || v === "") return null;
              return (
                <div key={f} className="text-xs">
                  <span className="text-muted-foreground">{f}: </span>
                  <span>{truncate(formatValue(v), 160)}</span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Preview unavailable — record not found.
            </div>
          )}
        </div>
      )}

      {/* Field-level diff */}
      {isTier1 ? (
        <Tier1ImportDetail p={p} payload={tier1Payload} />
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Field change
          </div>
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                Before
              </div>
              <code className="block text-xs whitespace-pre-wrap break-words">
                {formatValue(before)}
              </code>
            </div>
            <div className="flex justify-center text-muted-foreground">
              <ArrowRight className="h-3 w-3" aria-label="changes to" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                After
              </div>
              <code className="block text-xs whitespace-pre-wrap break-words">
                {formatValue(after)}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Source */}
      {(p.source_surface || p.source_issue_type || p.source_finding_id) && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Source</div>
          <div className="text-xs text-muted-foreground">
            {[p.source_surface, p.source_issue_type].filter(Boolean).join(" · ")}
            {p.source_finding_id && (
              <span className="block font-mono text-[10px]">{p.source_finding_id}</span>
            )}
          </div>
        </div>
      )}

      {/* Reviewer note */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground block">
          Reviewer note
        </label>
        <Textarea
          value={reviewerNote}
          onChange={(e) => onReviewerNoteChange(e.target.value)}
          placeholder={isPending ? "Optional — context for this decision." : "No note."}
          rows={2}
          disabled={!isPending}
          className="text-xs"
        />
      </div>

      {/* Apply error */}
      {p.apply_error && (
        <div className="flex items-start gap-2 text-destructive text-xs border border-destructive/30 bg-destructive/5 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{p.apply_error}</span>
        </div>
      )}

      {isTier1 && p.validation_status === "invalid" && isPending && (
        <div className="flex items-start gap-2 text-destructive text-xs border border-destructive/30 bg-destructive/5 rounded-md p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Invalid import rows should be rejected or restaged after correction.</span>
        </div>
      )}

      {/* Actions */}
      {isPending ? (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onApprove} disabled={acting || !canApply} className="flex-1">
            <Check className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={acting} className="flex-1">
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">
          {p.reviewed_at ? `Reviewed ${new Date(p.reviewed_at).toLocaleString()}` : null}
        </div>
      )}
    </div>
  );
}
