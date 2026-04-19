// Reviewer Throughput — compact, read-only operational metrics on
// staged_changes. Lives on the DataManager Dashboard alongside Recently
// applied and Normalization Review Insights.
//
// Strict scope:
//   - read-only (no mutations, no review controls)
//   - reviewed = applied + rejected within window (by reviewed_at)
//   - failed counted within window (by reviewed_at, falling back to updated_at)
//   - avg review time over applied/rejected with reviewed_at + proposed_at
//   - oldest pending = current age of oldest pending proposal (window-agnostic)
//   - timeframe selector: 7 days / 30 days / all time
//   - subscribes to realtime so it stays current after review actions

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
  proposed_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

function windowSinceMs(w: Window): number | null {
  if (w === "all") return null;
  const days = w === "7d" ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins ? `${hours}h ${remMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

export default function ReviewerThroughput() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [win, setWin] = useState<Window>("7d");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("staged_changes")
      .select("id, status, target_table, proposed_at, reviewed_at, updated_at")
      .order("proposed_at", { ascending: false })
      .limit(1000);
    if (error || !data) {
      setRows([]);
    } else {
      setRows(data as Row[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("reviewer_throughput_feed")
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

  const metrics = useMemo(() => {
    const sinceMs = windowSinceMs(win);
    const inWindow = (iso: string | null) => {
      if (!iso) return false;
      if (sinceMs === null) return true;
      return new Date(iso).getTime() >= sinceMs;
    };

    const applied = rows.filter(
      (r) => r.status === "applied" && inWindow(r.reviewed_at),
    );
    const rejected = rows.filter(
      (r) => r.status === "rejected" && inWindow(r.reviewed_at),
    );
    const failed = rows.filter(
      (r) =>
        r.status === "failed" &&
        inWindow(r.reviewed_at ?? r.updated_at),
    );
    const reviewed = applied.length + rejected.length;

    // Average review time across applied + rejected with both timestamps
    const reviewable = [...applied, ...rejected].filter(
      (r) => r.reviewed_at && r.proposed_at,
    );
    const totalMs = reviewable.reduce(
      (sum, r) =>
        sum +
        (new Date(r.reviewed_at as string).getTime() -
          new Date(r.proposed_at).getTime()),
      0,
    );
    const avgMs = reviewable.length ? totalMs / reviewable.length : null;

    // Oldest pending — window-agnostic (current backlog age)
    const pendings = rows.filter((r) => r.status === "pending");
    const oldestPending = pendings.reduce<number | null>((oldest, r) => {
      const t = new Date(r.proposed_at).getTime();
      return oldest === null || t < oldest ? t : oldest;
    }, null);
    const oldestPendingMs =
      oldestPending !== null ? Date.now() - oldestPending : null;

    // Per-table average clearance time (applied + rejected) within window
    const tableTimes = new Map<string, { sum: number; count: number }>();
    for (const r of reviewable) {
      const ms =
        new Date(r.reviewed_at as string).getTime() -
        new Date(r.proposed_at).getTime();
      const cur = tableTimes.get(r.target_table) ?? { sum: 0, count: 0 };
      cur.sum += ms;
      cur.count += 1;
      tableTimes.set(r.target_table, cur);
    }
    const tableAvgs = Array.from(tableTimes.entries())
      .map(([table, v]) => ({ table, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => a.avg - b.avg);
    const fastest = tableAvgs[0] ?? null;
    const slowest = tableAvgs.length > 1 ? tableAvgs[tableAvgs.length - 1] : null;

    return {
      reviewed,
      applied: applied.length,
      rejected: rejected.length,
      failed: failed.length,
      pending: pendings.length,
      avgMs,
      oldestPendingMs,
      fastest,
      slowest,
    };
  }, [rows, win]);

  const noActivity =
    metrics.reviewed === 0 && metrics.failed === 0 && metrics.pending === 0;

  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-ink">
          Reviewer Throughput
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
        ) : noActivity ? (
          <p className="text-ink-muted">No review activity yet.</p>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Reviewed</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.reviewed}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Applied</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.applied}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Rejected</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.rejected}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted text-xs">Failed</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.failed}
                </dd>
              </div>
              <div className="flex justify-between col-span-2">
                <dt className="text-ink-muted text-xs">Avg review time</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.avgMs !== null ? formatDuration(metrics.avgMs) : "—"}
                </dd>
              </div>
              <div className="flex justify-between col-span-2">
                <dt className="text-ink-muted text-xs">Oldest pending</dt>
                <dd className="text-ink tabular-nums text-xs">
                  {metrics.oldestPendingMs !== null
                    ? formatDuration(metrics.oldestPendingMs)
                    : "None"}
                </dd>
              </div>
            </dl>

            {(metrics.fastest || metrics.slowest) && (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                  Clearance by table
                </p>
                <ul className="space-y-0.5">
                  {metrics.fastest && (
                    <li className="flex justify-between gap-2 text-xs">
                      <span className="text-ink-muted">Fastest</span>
                      <span className="text-ink truncate" title={metrics.fastest.table}>
                        <span className="font-mono">{metrics.fastest.table}</span>
                        <span className="text-ink-muted ml-1.5 tabular-nums">
                          {formatDuration(metrics.fastest.avg)}
                        </span>
                      </span>
                    </li>
                  )}
                  {metrics.slowest && (
                    <li className="flex justify-between gap-2 text-xs">
                      <span className="text-ink-muted">Slowest</span>
                      <span className="text-ink truncate" title={metrics.slowest.table}>
                        <span className="font-mono">{metrics.slowest.table}</span>
                        <span className="text-ink-muted ml-1.5 tabular-nums">
                          {formatDuration(metrics.slowest.avg)}
                        </span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
