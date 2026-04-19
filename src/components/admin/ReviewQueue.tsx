// Review Queue — admin surface for normalization proposals.
//
// Lists pending proposals with a field-level diff (current → proposed),
// approve (invokes apply-normalization-proposal edge function which uses
// service role to apply the change atomically with optimistic concurrency),
// and reject (status update only; no live mutation). History view shows
// approved/rejected/failed proposals.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Check, X, RefreshCw, AlertTriangle } from "lucide-react";

interface Proposal {
  id: string;
  target_table: string;
  target_record_id: string;
  target_field: string;
  current_value: unknown;
  proposed_value: unknown;
  source_surface: string;
  source_issue_type: string | null;
  source_value: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected" | "failed";
  apply_error: string | null;
  proposed_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

function formatValue(v: unknown): string {
  if (v == null) return "(empty)";
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return "[" + v.map((x) => JSON.stringify(x)).join(", ") + "]";
  }
  if (typeof v === "string") return v === "" ? "(empty string)" : v;
  return JSON.stringify(v);
}

function statusVariant(s: Proposal["status"]) {
  if (s === "approved") return "default" as const;
  if (s === "rejected") return "secondary" as const;
  if (s === "failed") return "destructive" as const;
  return "outline" as const;
}

export default function ReviewQueue() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "history">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("normalization_proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load proposals", description: error.message, variant: "destructive" });
      setProposals([]);
    } else {
      setProposals((data ?? []) as Proposal[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => proposals.filter((p) => p.status === "pending"), [proposals]);
  const history = useMemo(() => proposals.filter((p) => p.status !== "pending"), [proposals]);

  const handleApprove = async (p: Proposal) => {
    setActingId(p.id);
    const { data, error } = await supabase.functions.invoke("apply-normalization-proposal", {
      body: { proposal_id: p.id },
    });
    setActingId(null);
    if (error) {
      const msg = (data as { error?: string } | null)?.error ?? error.message;
      toast({ title: "Approval failed", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Change applied", description: `${p.target_table}.${p.target_field} updated.` });
    }
    load();
  };

  const handleReject = async (p: Proposal) => {
    setActingId(p.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("normalization_proposals")
      .update({
        status: "rejected",
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

  const renderRow = (p: Proposal, withActions: boolean) => (
    <TableRow key={p.id}>
      <TableCell className="align-top">
        <div className="text-sm font-medium">{p.target_table}.{p.target_field}</div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">{p.target_record_id}</div>
        {p.source_issue_type && (
          <div className="text-[11px] text-muted-foreground mt-1">
            via {p.source_surface} · {p.source_issue_type}
          </div>
        )}
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground w-16">Current</span>
            <code className="text-xs break-all">{formatValue(p.current_value)}</code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground w-16">Proposed</span>
            <code className="text-xs break-all">{formatValue(p.proposed_value)}</code>
          </div>
          {p.note && (
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground w-16">Note</span>
              <span className="text-xs text-muted-foreground">{p.note}</span>
            </div>
          )}
          {p.apply_error && (
            <div className="flex items-baseline gap-2 pt-1 text-destructive">
              <AlertTriangle className="h-3 w-3 mt-0.5" />
              <span className="text-xs">{p.apply_error}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="align-top whitespace-nowrap">
        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
        <div className="text-[11px] text-muted-foreground mt-1">
          {new Date(p.created_at).toLocaleString()}
        </div>
      </TableCell>
      {withActions && (
        <TableCell className="align-top whitespace-nowrap">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="default"
              disabled={actingId === p.id}
              onClick={() => handleApprove(p)}
            >
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actingId === p.id}
              onClick={() => handleReject(p)}
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Review queue</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Approve applies the change via a server-side function with stale-snapshot protection. Reject leaves the live record untouched.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "history")}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="tabular-nums">{pending.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              History
              <Badge variant="secondary" className="tabular-nums">{history.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No pending proposals.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Diff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{pending.map((p) => renderRow(p, true))}</TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No reviewed proposals yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Diff</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{history.map((p) => renderRow(p, false))}</TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
