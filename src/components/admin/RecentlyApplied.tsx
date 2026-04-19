// Recently applied — compact, read-only summary of the most recent applied
// staged_changes. Lives on the DataManager Dashboard. Subscribes to the same
// realtime channel as the Review queue badge so it stays current after every
// approve / reject / new submission.
//
// Strict scope:
//   - read-only (no mutations, no editing affordances)
//   - last 8 applied proposals, most recent first
//   - reuses the same readable summary format used elsewhere
//   - hides reviewer email behind a SECURITY DEFINER function (existing
//     get_user_emails) so we never expose auth.users to the client

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const LIMIT = 8;

interface AppliedRow {
  id: string;
  target_table: string;
  target_record_id: string;
  changed_fields: string[];
  original_snapshot: Record<string, unknown> | null;
  proposed_patch: Record<string, unknown> | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  proposal_type: string;
}

interface DisplayRow extends AppliedRow {
  reviewerLabel: string | null;
  summary: string;
}

function formatTagDiff(before: unknown, after: unknown): { from: string; to: string } | null {
  if (!Array.isArray(before) || !Array.isArray(after)) return null;
  const removed = before.filter((v) => !after.includes(v));
  const added = after.filter((v) => !(before as unknown[]).includes(v));
  // v1 only allows single-tag normalization, so we expect exactly one of each.
  if (removed.length === 1 && added.length === 1) {
    return { from: String(removed[0]), to: String(added[0]) };
  }
  return null;
}

function buildSummary(row: AppliedRow): string {
  const field = row.changed_fields[0];
  if (!field) return `${row.proposal_type} on ${row.target_table}`;
  const before = row.original_snapshot?.[field];
  const after = row.proposed_patch?.[field];

  const tagDiff = formatTagDiff(before, after);
  if (tagDiff) {
    return `Normalize tag "${tagDiff.from}" → "${tagDiff.to}" in ${row.target_table}.${field}`;
  }
  if (typeof before === "string" && typeof after === "string") {
    return `Normalize "${before}" → "${after}" in ${row.target_table}.${field}`;
  }
  return `Update ${row.target_table}.${field}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function reviewerShort(email: string | null, userId: string | null): string {
  if (email) {
    const local = email.split("@")[0];
    return local.length > 18 ? local.slice(0, 17) + "…" : local;
  }
  if (userId) return userId.slice(0, 8);
  return "—";
}

export default function RecentlyApplied() {
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("staged_changes")
      .select(
        "id, target_table, target_record_id, changed_fields, original_snapshot, proposed_patch, reviewed_at, reviewed_by, proposal_type",
      )
      .eq("status", "applied")
      .order("reviewed_at", { ascending: false, nullsFirst: false })
      .limit(LIMIT);

    if (error || !data) {
      setRows([]);
      setLoading(false);
      return;
    }

    const base: AppliedRow[] = data.map((r) => ({
      id: r.id,
      target_table: r.target_table,
      target_record_id: r.target_record_id,
      changed_fields: r.changed_fields ?? [],
      original_snapshot: (r.original_snapshot ?? null) as Record<string, unknown> | null,
      proposed_patch: (r.proposed_patch ?? null) as Record<string, unknown> | null,
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
      proposal_type: r.proposal_type,
    }));

    // Resolve reviewer emails via the existing admin-only RPC. Failure is
    // tolerated — we just fall back to a short user-id label.
    const reviewerIds = Array.from(
      new Set(base.map((r) => r.reviewed_by).filter((v): v is string => !!v)),
    );
    const emailMap = new Map<string, string>();
    if (reviewerIds.length > 0) {
      const { data: emailRows } = await supabase.rpc("get_user_emails", {
        _user_ids: reviewerIds,
      });
      if (emailRows) {
        for (const er of emailRows as Array<{ user_id: string; email: string }>) {
          emailMap.set(er.user_id, er.email);
        }
      }
    }

    setRows(
      base.map((r) => ({
        ...r,
        reviewerLabel: reviewerShort(emailMap.get(r.reviewed_by ?? "") ?? null, r.reviewed_by),
        summary: buildSummary(r),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("recently_applied_feed")
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

  return (
    <Card className="border-rule shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ink">Recently applied</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-ink-muted">No applied changes yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="space-y-0.5">
                <p className="text-ink leading-snug truncate" title={r.summary}>
                  {r.summary}
                </p>
                <p className="text-[11px] text-ink-muted font-mono">
                  {r.target_table} · {r.target_record_id}
                  {r.changed_fields[0] ? ` · ${r.changed_fields[0]}` : ""}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Applied {formatTime(r.reviewed_at)}
                  {r.reviewerLabel ? ` by ${r.reviewerLabel}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
