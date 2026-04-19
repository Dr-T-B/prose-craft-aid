// Route Integrity Snapshot — compact, read-only view of route-reference health.
//
// Strict scope:
//   - read-only (no mutations, no edit affordances)
//   - filters Vocabulary findings to route-reference fields (routeLookup=true)
//   - merges with staged_changes normalization activity for those fields
//   - 7d/30d/all-time selector for proposal activity
//   - subscribes to staged_changes realtime so it stays current

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { runVocabularyAudit, AUDITABLE_FIELDS } from "@/lib/vocabularyAudit";

type Window = "7d" | "30d" | "all";
type Health = "Clear" | "Watch" | "Needs attention";

interface RouteFieldRow {
  key: string;
  label: string;
  table: string;
  field: string;
  findings: number;
  unknownRefs: number;
  pending: number;
  applied: number;
}

const ROUTE_FIELDS = AUDITABLE_FIELDS.filter((f) => f.routeLookup);
const ROUTE_FIELD_KEYS = new Set(ROUTE_FIELDS.map((f) => `${f.table}.${f.field}`));

function windowSinceIso(w: Window): string | null {
  if (w === "all") return null;
  const days = w === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function deriveHealth(unresolved: number, pending: number): Health {
  if (unresolved === 0 && pending === 0) return "Clear";
  if (unresolved >= 5 || pending >= 3) return "Needs attention";
  return "Watch";
}

function HealthBadge({ health }: { health: Health }) {
  const cls =
    health === "Needs attention"
      ? "border-destructive/40 text-destructive"
      : health === "Watch"
        ? "border-rule text-ink"
        : "border-rule text-ink-muted";
  return (
    <Badge variant="outline" className={`text-[10px] ${cls}`}>
      {health}
    </Badge>
  );
}

export type RouteIntegrityNavigation =
  | { surface: "vocabulary"; table?: string; field?: string; issueType?: string }
  | { surface: "review"; status?: string; table?: string; search?: string };

interface RouteIntegritySnapshotProps {
  onNavigate?: (target: RouteIntegrityNavigation) => void;
}

export default function RouteIntegritySnapshot({ onNavigate }: RouteIntegritySnapshotProps = {}) {
  const [auditRows, setAuditRows] = useState<
    Array<{ key: string; issueType: string }>
  >([]);
  const [proposals, setProposals] = useState<
    Array<{ status: string; key: string; reviewed_at: string | null; proposed_at: string }>
  >([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [win, setWin] = useState<Window>("7d");

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const r = await runVocabularyAudit();
      const out: Array<{ key: string; issueType: string }> = [];
      for (const f of r.findings) {
        const key = `${f.table}.${f.field}`;
        if (ROUTE_FIELD_KEYS.has(key)) out.push({ key, issueType: f.issueType });
      }
      setAuditRows(out);
    } catch {
      setAuditRows([]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const loadProposals = useCallback(async () => {
    const { data, error } = await supabase
      .from("staged_changes")
      .select("status, target_table, changed_fields, reviewed_at, proposed_at")
      .eq("proposal_type", "normalization")
      .order("proposed_at", { ascending: false })
      .limit(1000);
    if (error || !data) {
      setProposals([]);
    } else {
      setProposals(
        data
          .map((r) => {
            const field = (r.changed_fields ?? [])[0] ?? null;
            return field
              ? {
                  status: r.status,
                  key: `${r.target_table}.${field}`,
                  reviewed_at: r.reviewed_at,
                  proposed_at: r.proposed_at,
                }
              : null;
          })
          .filter((r): r is NonNullable<typeof r> => !!r && ROUTE_FIELD_KEYS.has(r.key)),
      );
    }
    setLoadingProposals(false);
  }, []);

  useEffect(() => {
    loadAudit();
    loadProposals();
    const channel = supabase
      .channel("route_integrity_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staged_changes" },
        () => loadProposals(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAudit, loadProposals]);

  const { metrics, ranked } = useMemo(() => {
    const sinceIso = windowSinceIso(win);
    const inWindow = (iso: string | null) => {
      if (!iso) return false;
      if (!sinceIso) return true;
      return iso >= sinceIso;
    };

    const map = new Map<string, RouteFieldRow>();
    for (const spec of ROUTE_FIELDS) {
      const key = `${spec.table}.${spec.field}`;
      map.set(key, {
        key,
        label: key,
        table: spec.table,
        field: spec.field,
        findings: 0,
        unknownRefs: 0,
        pending: 0,
        applied: 0,
      });
    }

    for (const f of auditRows) {
      const row = map.get(f.key);
      if (!row) continue;
      row.findings += 1;
      if (f.issueType === "unknown_route") row.unknownRefs += 1;
    }

    for (const p of proposals) {
      const row = map.get(p.key);
      if (!row) continue;
      if (p.status === "pending" && inWindow(p.proposed_at)) row.pending += 1;
      if (p.status === "applied" && inWindow(p.reviewed_at)) row.applied += 1;
    }

    const all = Array.from(map.values());
    const totals = all.reduce(
      (acc, r) => {
        acc.findings += r.findings;
        acc.unknownRefs += r.unknownRefs;
        acc.pending += r.pending;
        acc.applied += r.applied;
        return acc;
      },
      { findings: 0, unknownRefs: 0, pending: 0, applied: 0 },
    );

    const ranked = all
      .filter((r) => r.findings + r.pending + r.applied > 0)
      .sort(
        (a, b) =>
          b.findings + b.pending * 2 - (a.findings + a.pending * 2) ||
          b.applied - a.applied,
      );

    const mostAffected = ranked[0] ?? null;
    const health = deriveHealth(totals.findings, totals.pending);

    return {
      metrics: { ...totals, mostAffected, health },
      ranked,
    };
  }, [auditRows, proposals, win]);

  const loading = loadingAudit || loadingProposals;
  const empty =
    !loading &&
    metrics.findings === 0 &&
    metrics.pending === 0 &&
    metrics.applied === 0;

  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-ink">
          Route Integrity Snapshot
        </CardTitle>
        <Select value={win} onValueChange={(v) => setWin(v as Window)}>
          <SelectTrigger className="h-7 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        ) : empty ? (
          <p className="text-ink-muted">No route integrity issues detected.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-ink-muted">
                Overall
              </span>
              <HealthBadge health={metrics.health} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <MetricLine
                label="Unresolved findings"
                value={metrics.findings}
                onClick={
                  onNavigate && metrics.findings > 0
                    ? () => onNavigate({ surface: "vocabulary" })
                    : undefined
                }
                title="View route findings in Vocabulary"
              />
              <MetricLine
                label="Unknown refs"
                value={metrics.unknownRefs}
                onClick={
                  onNavigate && metrics.unknownRefs > 0
                    ? () =>
                        onNavigate({
                          surface: "vocabulary",
                          issueType: "unknown_route",
                        })
                    : undefined
                }
                title="View unknown-route findings in Vocabulary"
              />
              <MetricLine
                label="Pending"
                value={metrics.pending}
                onClick={
                  onNavigate && metrics.pending > 0
                    ? () =>
                        onNavigate({
                          surface: "review",
                          status: "pending",
                          search: "_route_id",
                        })
                    : undefined
                }
                title="View pending route normalizations in Review queue"
              />
              <MetricLine
                label="Applied"
                value={metrics.applied}
                onClick={
                  onNavigate && metrics.applied > 0
                    ? () =>
                        onNavigate({
                          surface: "review",
                          status: "applied",
                          search: "_route_id",
                        })
                    : undefined
                }
                title="View applied route normalizations in Review queue"
              />
              {metrics.mostAffected && (
                <div className="flex justify-between col-span-2">
                  <dt className="text-ink-muted text-xs">Most affected</dt>
                  <dd
                    className="text-ink font-mono text-xs truncate"
                    title={metrics.mostAffected.label}
                  >
                    {metrics.mostAffected.label}
                  </dd>
                </div>
              )}
            </dl>

            {ranked.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                  Route fields by pressure
                </p>
                <ul className="space-y-1.5">
                  {ranked.map((r) => {
                    const inner = (
                      <>
                        <span
                          className="font-mono text-xs text-ink truncate block text-left"
                          title={r.label}
                        >
                          {r.label}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-ink-muted tabular-nums">
                          <span>
                            Findings <span className="text-ink">{r.findings}</span>
                          </span>
                          <span>
                            Pending <span className="text-ink">{r.pending}</span>
                          </span>
                          <span>
                            Applied <span className="text-ink">{r.applied}</span>
                          </span>
                        </div>
                      </>
                    );
                    return (
                      <li key={r.key}>
                        {onNavigate ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate({
                                surface: "vocabulary",
                                table: r.table,
                                field: r.field,
                              })
                            }
                            className="w-full text-left space-y-0.5 rounded-sm px-1 -mx-1 py-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            title={`View ${r.label} in Vocabulary`}
                          >
                            {inner}
                          </button>
                        ) : (
                          <div className="space-y-0.5">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
