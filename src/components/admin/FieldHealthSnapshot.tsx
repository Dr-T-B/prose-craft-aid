// Field Health Snapshot — compact, read-only view of which controlled fields
// are under the most vocabulary + normalization pressure.
//
// Strict scope:
//   - read-only (no mutations, no edit affordances)
//   - merges current Vocabulary outlier counts with staged_changes
//     normalization activity (proposals + applied) within window
//   - top 5 fields by combined pressure
//   - timeframe selector: 7 days / 30 days / all time (proposal activity)
//   - subscribes to staged_changes realtime; re-runs audit on demand

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
type Health = "Stable" | "Watch" | "Needs attention";

interface FieldRow {
  key: string; // table.field
  table: string;
  field: string;
  label: string;
  outliers: number;
  proposals: number; // pending normalization proposals (window)
  applied: number; // applied normalization (window)
  pressure: number;
  health: Health;
}

function windowSinceIso(w: Window): string | null {
  if (w === "all") return null;
  const days = w === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function deriveHealth(outliers: number, proposals: number, applied: number): Health {
  // Simple, transparent thresholds. Not scientific — purely operational.
  if (outliers >= 8 || proposals >= 3 || outliers + proposals >= 6) {
    return "Needs attention";
  }
  if (outliers >= 3 || proposals >= 1 || applied >= 2) return "Watch";
  return "Stable";
}

function HealthBadge({ health }: { health: Health }) {
  if (health === "Needs attention") {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">
        Needs attention
      </Badge>
    );
  }
  if (health === "Watch") {
    return (
      <Badge variant="outline" className="border-rule text-ink text-[10px]">
        Watch
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rule text-ink-muted text-[10px]">
      Stable
    </Badge>
  );
}

export type FieldHealthNavigation =
  | { surface: "vocabulary"; table?: string; field?: string; issueType?: string }
  | { surface: "review"; status?: string; table?: string; search?: string };

interface FieldHealthSnapshotProps {
  onNavigate?: (target: FieldHealthNavigation) => void;
}

export default function FieldHealthSnapshot({ onNavigate }: FieldHealthSnapshotProps = {}) {
  const [outliers, setOutliers] = useState<Map<string, number>>(new Map());
  const [proposals, setProposals] = useState<
    Array<{ status: string; target_table: string; field: string | null; reviewed_at: string | null; proposed_at: string }>
  >([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [win, setWin] = useState<Window>("7d");

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const r = await runVocabularyAudit();
      const m = new Map<string, number>();
      for (const f of r.findings) {
        const k = `${f.table}.${f.field}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      setOutliers(m);
    } catch {
      setOutliers(new Map());
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
        data.map((r) => ({
          status: r.status,
          target_table: r.target_table,
          field: (r.changed_fields ?? [])[0] ?? null,
          reviewed_at: r.reviewed_at,
          proposed_at: r.proposed_at,
        })),
      );
    }
    setLoadingProposals(false);
  }, []);

  useEffect(() => {
    loadAudit();
    loadProposals();
    const channel = supabase
      .channel("field_health_feed")
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

  // Field Health is scoped to controlled-vocabulary pressure only.
  // Exclude fields explicitly marked structural-only (descriptive prose),
  // which are audited for shape but are not vocabulary-governed.
  const includedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const spec of AUDITABLE_FIELDS) {
      if (spec.mode === "structural-only") continue;
      set.add(`${spec.table}.${spec.field}`);
    }
    return set;
  }, []);

  const rows = useMemo<FieldRow[]>(() => {
    const sinceIso = windowSinceIso(win);
    const inWindow = (iso: string | null) => {
      if (!iso) return false;
      if (!sinceIso) return true;
      return iso >= sinceIso;
    };

    // Build base map of all known auditable fields so we can show stable ones too.
    const map = new Map<string, FieldRow>();
    for (const spec of AUDITABLE_FIELDS) {
      const key = `${spec.table}.${spec.field}`;
      if (!includedKeys.has(key)) continue;
      map.set(key, {
        key,
        table: spec.table,
        field: spec.field,
        label: `${spec.table}.${spec.field}`,
        outliers: outliers.get(key) ?? 0,
        proposals: 0,
        applied: 0,
        pressure: 0,
        health: "Stable",
      });
    }

    for (const p of proposals) {
      if (!p.field) continue;
      const key = `${p.target_table}.${p.field}`;
      if (!includedKeys.has(key)) continue;
      let row = map.get(key);
      if (!row) {
        row = {
          key,
          table: p.target_table,
          field: p.field,
          label: key,
          outliers: outliers.get(key) ?? 0,
          proposals: 0,
          applied: 0,
          pressure: 0,
          health: "Stable",
        };
        map.set(key, row);
      }
      if (p.status === "pending" && inWindow(p.proposed_at)) row.proposals += 1;
      if (p.status === "applied" && inWindow(p.reviewed_at)) row.applied += 1;
    }

    const all = Array.from(map.values()).map((r) => {
      // Lightweight weighting: outliers + 2*pending + applied
      const pressure = r.outliers + r.proposals * 2 + r.applied;
      return {
        ...r,
        pressure,
        health: deriveHealth(r.outliers, r.proposals, r.applied),
      };
    });

    return all
      .filter((r) => r.pressure > 0)
      .sort((a, b) => b.pressure - a.pressure)
      .slice(0, 5);
  }, [outliers, proposals, win, includedKeys]);

  const loading = loadingAudit || loadingProposals;

  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-ink">Field Health Snapshot</CardTitle>
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
        ) : rows.length === 0 ? (
          <p className="text-ink-muted">No field health issues detected yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-xs text-ink truncate block text-left"
                      title={r.label}
                    >
                      {r.label}
                    </span>
                    <HealthBadge health={r.health} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-ink-muted tabular-nums">
                    <span>
                      Outliers <span className="text-ink">{r.outliers}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      Proposals <span className="text-ink">{r.proposals}</span>
                      {onNavigate && r.proposals > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate({
                              surface: "review",
                              status: "pending",
                              table: r.table,
                              search: r.field,
                            });
                          }}
                          className="inline-flex items-center text-[10px] text-primary hover:text-primary-foreground hover:bg-primary/90 px-1.5 py-0.5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          title={`Review pending proposals for ${r.label}`}
                        >
                          Review
                        </button>
                      )}
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
                      className="w-full text-left space-y-1 rounded-sm px-1 -mx-1 py-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      title={`View ${r.label} in Vocabulary`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div className="space-y-1">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-ink-muted leading-snug">
          Controlled taxonomy fields only. Descriptive prose fields are excluded.
        </p>
      </CardContent>
    </Card>
  );
}
