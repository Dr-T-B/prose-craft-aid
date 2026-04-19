// Propose Normalization — small governance form launched from a Vocabulary
// finding's canonical candidate. Builds a single-record, single-field patch
// and inserts it into staged_changes for the Review Queue. Never mutates the
// live record directly.
//
// v1 scope (enforced here AND on the server by apply-staged-change):
//   - one record per proposal
//   - one field per proposal
//   - array-tag fields → replace the selected tag in the chosen record only,
//     preserving other tags and deduplicating if the replacement already exists
//   - scalar fields → replace the stored value with the proposed value
//   - no-op proposals are blocked client-side

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import type { VocabularyFinding } from "@/lib/vocabularyAudit";
import type { Json } from "@/integrations/supabase/types";

interface ProposeNormalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: VocabularyFinding;
  /** Canonical replacement value derived from the audit (already non-empty). */
  canonicalCandidate: string;
  /** True when the audit considers this field an array-tag. */
  arrayMode: boolean;
  /** Optional callback after successful submit. */
  onSubmitted?: () => void;
}

interface LiveRow {
  id: string;
  value: unknown;
}

function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function ProposeNormalizationDialog({
  open,
  onOpenChange,
  finding,
  canonicalCandidate,
  arrayMode,
  onSubmitted,
}: ProposeNormalizationDialogProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    finding.exampleRecordIds[0] ?? "",
  );
  const [note, setNote] = useState("");
  const [proposedValue, setProposedValue] = useState(canonicalCandidate);
  const [liveRow, setLiveRow] = useState<LiveRow | null>(null);
  const [loadingRow, setLoadingRow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Reset state every time the dialog (re)opens for a new finding/candidate.
  useEffect(() => {
    if (!open) return;
    setSelectedRecordId(finding.exampleRecordIds[0] ?? "");
    setProposedValue(canonicalCandidate);
    setNote("");
    setConfirmed(false);
  }, [open, finding.id, canonicalCandidate, finding.exampleRecordIds]);

  // Fetch the live record so we capture an accurate original_snapshot AND can
  // verify that finding.storedValue is actually present in this record (the
  // audit's exampleRecordIds list is from a snapshot that may be stale).
  useEffect(() => {
    if (!open || !selectedRecordId) {
      setLiveRow(null);
      return;
    }
    let cancelled = false;
    setLoadingRow(true);
    (async () => {
      const { data, error } = await supabase
        .from(finding.table as never)
        .select(`id, ${finding.field}`)
        .eq("id", selectedRecordId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLiveRow(null);
      } else {
        const row = data as Record<string, unknown>;
        setLiveRow({ id: String(row.id), value: row[finding.field] });
      }
      setLoadingRow(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedRecordId, finding.table, finding.field]);

  // Compute the patch deterministically from the live row + proposed value.
  // For array-tag: replace the selected tag in-place, preserving order and
  // deduplicating if the replacement already exists elsewhere in the array.
  const patchPlan = useMemo(():
    | { kind: "ok"; before: unknown; after: unknown; recordExists: true }
    | { kind: "loading" }
    | { kind: "missing_record" }
    | { kind: "value_not_present" }
    | { kind: "empty_proposed" }
    | { kind: "noop" }
    | { kind: "type_mismatch" } => {
    const trimmedProposed = proposedValue.trim();
    if (!trimmedProposed) return { kind: "empty_proposed" };
    if (loadingRow) return { kind: "loading" };
    if (!liveRow) return { kind: "missing_record" };

    if (arrayMode) {
      const arr = Array.isArray(liveRow.value) ? (liveRow.value as unknown[]) : null;
      if (!arr) return { kind: "type_mismatch" };
      const idx = arr.findIndex((v) => v === finding.storedValue);
      if (idx === -1) return { kind: "value_not_present" };
      // Replace the tag at idx, then dedupe while preserving first-seen order.
      const replaced = arr.map((v, i) => (i === idx ? trimmedProposed : v));
      const seen = new Set<unknown>();
      const after: unknown[] = [];
      for (const v of replaced) {
        if (!seen.has(v)) {
          seen.add(v);
          after.push(v);
        }
      }
      if (arraysEqual(arr, after)) return { kind: "noop" };
      return { kind: "ok", before: arr, after, recordExists: true };
    }

    // Scalar
    if (typeof liveRow.value !== "string" && liveRow.value !== null) {
      return { kind: "type_mismatch" };
    }
    const current = (liveRow.value as string | null) ?? "";
    if (current !== finding.storedValue) return { kind: "value_not_present" };
    if (current === trimmedProposed) return { kind: "noop" };
    return { kind: "ok", before: current, after: trimmedProposed, recordExists: true };
  }, [arrayMode, finding.storedValue, liveRow, loadingRow, proposedValue]);

  const canSubmit =
    patchPlan.kind === "ok" && confirmed && !submitting && selectedRecordId !== "";

  const handleSubmit = async () => {
    if (patchPlan.kind !== "ok") return;
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("staged_changes").insert([
      {
        proposal_type: "normalization",
        target_table: finding.table,
        target_record_id: selectedRecordId,
        changed_fields: [finding.field],
        // Snapshot the affected field only — that's what the apply step
        // re-checks for stale-proposal protection.
        original_snapshot: { [finding.field]: patchPlan.before } as unknown as Json,
        proposed_patch: { [finding.field]: patchPlan.after } as unknown as Json,
        source_surface: "vocabulary_audit",
        source_finding_id: finding.id,
        source_issue_type: finding.issueType,
        note: note.trim() || null,
        status: "pending",
        proposed_by: userData.user?.id ?? null,
      },
    ]);
    setSubmitting(false);
    if (error) {
      toast({
        title: "Could not submit proposal",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Proposal submitted",
      description: "Sent to the Review queue for approval.",
    });
    onSubmitted?.();
    onOpenChange(false);
  };

  const blockerMessage = (() => {
    switch (patchPlan.kind) {
      case "loading":
        return null;
      case "missing_record":
        return "Selected record could not be loaded — it may have been deleted.";
      case "value_not_present":
        return arrayMode
          ? `The tag "${finding.storedValue}" is no longer present in this record's ${finding.field}.`
          : `The current stored value of ${finding.field} no longer matches "${finding.storedValue}".`;
      case "empty_proposed":
        return "Proposed value cannot be empty.";
      case "noop":
        return "Proposed value would not change the record. Nothing to submit.";
      case "type_mismatch":
        return `Unexpected field type on the live record for ${finding.field}.`;
      default:
        return null;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose normalization</DialogTitle>
          <DialogDescription>
            Submit a single-field change to the Review queue. The live record is
            never updated until an admin approves the proposal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Identity */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{finding.table}</Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <code className="text-xs">{finding.field}</code>
              {arrayMode && (
                <Badge variant="secondary" className="text-[10px]">array-tag</Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Source: vocabulary_audit · {finding.issueType}
            </p>
          </div>

          {/* Record select */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground block">
              Example record
            </label>
            {finding.exampleRecordIds.length > 1 ? (
              <Select
                value={selectedRecordId}
                onValueChange={setSelectedRecordId}
                disabled={submitting}
              >
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {finding.exampleRecordIds.map((id) => (
                    <SelectItem key={id} value={id} className="font-mono text-xs">
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <code className="block text-xs px-2 py-1.5 rounded bg-muted">
                {selectedRecordId || "(no record)"}
              </code>
            )}
            <p className="text-[11px] text-muted-foreground">
              v1 applies to one record at a time. Other records using the same value remain untouched.
            </p>
          </div>

          {/* Proposed value */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground block">
              {arrayMode ? "Replacement tag" : "Proposed value"}
            </label>
            <Input
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              disabled={submitting}
              className="font-mono text-xs"
            />
          </div>

          {/* Field-level diff preview */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground block">
              {arrayMode ? "Tag-level change" : "Field change"}
            </label>
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              {patchPlan.kind === "loading" ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading live record…
                </div>
              ) : patchPlan.kind === "ok" ? (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Before
                    </div>
                    <code className="block text-xs whitespace-pre-wrap break-words">
                      {Array.isArray(patchPlan.before)
                        ? "[ " + patchPlan.before.map((v) => String(v)).join(", ") + " ]"
                        : String(patchPlan.before)}
                    </code>
                  </div>
                  <div className="flex justify-center text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      After
                    </div>
                    <code className="block text-xs whitespace-pre-wrap break-words">
                      {Array.isArray(patchPlan.after)
                        ? "[ " + patchPlan.after.map((v) => String(v)).join(", ") + " ]"
                        : String(patchPlan.after)}
                    </code>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{blockerMessage ?? "Cannot build a valid patch."}</span>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground block">
              Reviewer note (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              rows={2}
              placeholder="Why this normalization is appropriate."
              className="text-xs"
              maxLength={500}
            />
          </div>

          {/* Explicit confirmation */}
          {patchPlan.kind === "ok" && (
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={submitting}
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                I have reviewed the change and want to send it to the Review queue.
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
            Submit to review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
