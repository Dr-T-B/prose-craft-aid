// Normalization Review Insights — compact, read-only analytics on
// staged_changes where proposal_type = 'normalization'. Lives on the
// DataManager Dashboard alongside Recently applied.
//
// Strict scope:
//   - read-only (no mutations, no review controls)
//   - aggregates pending + applied + rejected counts
//   - ranks most corrected fields, normalization pairs, affected tables
//   - timeframe selector: 7 days / 30 days / all time
//   - subscribes to the same realtime channel so it stays current

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Window = "7d" | "30d" | "all";

interface Row {
  id: string;
  status: string;
  target_table: string;
  changed_fields: string[];
  original_snapshot: Record<string, unknown> | null;
  proposed_patch: Record<string, unknown> | null;
  proposed_at: string;
}

function extractPair(row: Row): { from: string; to: string } | null {
  const field = row.changed_fields[0];
  if (!field) return null;
  const before = row.original_snapshot?.[field];
  const after = row.proposed_patch?.[field];
  if (typeof before === "string" && typeof after === "string" && before !== after) {
    return { from: before, to: after };
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const removed = before.filter((v) => !after.includes(v));
    const added = after.filter((v) => !(before as unknown[]).includes(v));
    if (removed.length === 1 && added.length === 1) {
      return { from: String(removed[0]), to: String(added[0]) };
    }
  }
  return null;
}

function rank<T extends string>(items: T[], top = 3): { key: T; count: number }[] {
  const map = new Map<T, number>();
  for (const it of items) map.set(it, (map.get(it) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top);
}

function windowSince(w: Window): string | null {
  if (w === "all") return null;
  const days = w === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default function NormalizationInsights() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [win, setWin] = useState<Window>("7d");

  const load = useCallback(async () => {
    let q = supabase
      .from("staged_changes")
      .select(
        "id, status, target_table, changed_fields, original_snapshot, proposed_patch, proposed_at",
      )
      .eq("proposal_type", "normalization")
      .order("proposed_at", { ascending: false })
      .limit(500);
    const since = windowSince(win);
    if (since) q = q.gte("proposed_at", since);
    const { data, error } = await q;
    if (error || !data) {
      setRows([]);
    } else {
      setRows(
        data.map((r) => ({
          id: r.id,
          status: r.status,
          target_table: r.target_table,
          changed_fields: r.changed_fields ?? [],
          original_snapshot: (r.original_snapshot ?? null) as Record<string, unknown> | null,
          proposed_patch: (r.proposed_patch ?? null) as Record<string, unknown> | null,
          proposed_at: r.proposed_at,
        })),
      );
    }
    setLoading(false);
  }, [win]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("normalization_insights_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staged_changes" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const insights = useMemo(() => {
    const total = rows.length;
    const applied = rows.filter((r) => r.status === "applied").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;

    const fieldKeys = rows
      .filter((r) => r.changed_fields[0])
      .map((r) => `${r.target_table}.${r.changed_fields[0]}`);
    const tableKeys = rows.map((r) => r.target_table);

    const pairKeys: string[] = [];
    for (const r of rows) {
      const p = extractPair(r);
      if (p) pairKeys.push(`${p.from} → ${p.to}`);
    }

    return {
      total,
      applied,
      pending,
      rejected,
      topFields: rank(fieldKeys, 3),
      topTables: rank(tableKeys, 3),
      topPairs: rank(pairKeys, 3),
    };
  }, [rows]);

  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-ink">
          Normalization Review Insights
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
        ) : insights.total === 0 ? (
          <p className="text-ink-muted">No normalization activity yet.</p>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Total</dt>
                <dd className="text-ink tabular-nums text-xs">{insights.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Applied</dt>
                <dd className="text-ink tabular-nums text-xs">{insights.applied}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Pending</dt>
                <dd className="text-ink tabular-nums text-xs">{insights.pending}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Rejected</dt>
                <dd className="text-ink tabular-nums text-xs">{insights.rejected}</dd>
              </div>
            </dl>

            {insights.topFields.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                  Most corrected fields
                </p>
                <ul className="space-y-0.5">
                  {insights.topFields.map((f) => (
                    <li
                      key={f.key}
                      className="flex justify-between gap-2 text-xs"
                    >
                      <span className="font-mono text-ink truncate" title={f.key}>
                        {f.key}
                      </span>
                      <span className="text-ink-muted tabular-nums">{f.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.topPairs.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                  Most common normalizations
                </p>
                <ul className="space-y-0.5">
                  {insights.topPairs.map((p) => (
                    <li
                      key={p.key}
                      className="flex justify-between gap-2 text-xs"
                    >
                      <span className="text-ink truncate" title={p.key}>
                        {p.key}
                      </span>
                      <span className="text-ink-muted tabular-nums">{p.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.topTables.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                  Top affected tables
                </p>
                <ul className="space-y-0.5">
                  {insights.topTables.map((t) => (
                    <li
                      key={t.key}
                      className="flex justify-between gap-2 text-xs"
                    >
                      <span className="font-mono text-ink truncate" title={t.key}>
                        {t.key}
                      </span>
                      <span className="text-ink-muted tabular-nums">{t.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
