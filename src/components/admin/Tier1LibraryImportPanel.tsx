import { useMemo, useState } from "react";
import Papa from "papaparse";
import { AlertTriangle, CheckCircle2, Database, FileWarning, Send } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  dryRunTier1LibraryImport,
  getTier1LibraryTargets,
  stageTier1LibraryImport,
  type Tier1ImportReport,
  type SupabaseLikeClient,
} from "@/lib/tier1LibraryImport";

interface Tier1LibraryImportPanelProps {
  onStaged?: () => void;
}

interface SourceMeta {
  sourceDataset: string;
  sourceSheet: string;
  sourceUrl: string;
  sourceSheetId: string;
}

function parseCsvText(csvText: string): Record<string, unknown>[] {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(first.message || "CSV parse failure");
  }
  return parsed.data.filter((row) =>
    Object.values(row).some((value) => value !== undefined && value !== null && String(value).trim() !== "")
  );
}

function issueText(issue: { field?: string; message: string }) {
  return issue.field ? `${issue.field}: ${issue.message}` : issue.message;
}

function unmappedFields(row: Record<string, unknown>): string[] {
  const metadata = row.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const unmapped = (metadata as Record<string, unknown>).unmapped_source_fields;
  if (!unmapped || typeof unmapped !== "object" || Array.isArray(unmapped)) return [];
  return Object.keys(unmapped);
}

export default function Tier1LibraryImportPanel({ onStaged }: Tier1LibraryImportPanelProps) {
  const { user } = useAuth();
  const targets = useMemo(() => getTier1LibraryTargets(), []);
  const [targetTable, setTargetTable] = useState(targets[0]?.tableName ?? "");
  const [csvText, setCsvText] = useState("");
  const [sourceMeta, setSourceMeta] = useState<SourceMeta>({
    sourceDataset: "",
    sourceSheet: "",
    sourceUrl: "",
    sourceSheetId: "",
  });
  const [report, setReport] = useState<Tier1ImportReport | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [dryRunning, setDryRunning] = useState(false);
  const [staging, setStaging] = useState(false);
  const [stageMessage, setStageMessage] = useState<string | null>(null);

  const selectedTarget = targets.find((target) => target.tableName === targetTable);
  const canStage = !!report && report.preparedRows.length > 0 && report.stageErrors.length === 0;

  const metaParams = {
    sourceDataset: sourceMeta.sourceDataset.trim() || undefined,
    sourceSheet: sourceMeta.sourceSheet.trim() || undefined,
    sourceUrl: sourceMeta.sourceUrl.trim() || undefined,
    sourceSheetId: sourceMeta.sourceSheetId.trim() || undefined,
  };

  const handleDryRun = async () => {
    setStageMessage(null);
    setReport(null);
    if (!targetTable) {
      toast.error("Select a Tier 1 target table first.");
      return;
    }
    if (!csvText.trim()) {
      toast.error("Paste CSV text before running a dry run.");
      return;
    }

    setDryRunning(true);
    try {
      const rows = parseCsvText(csvText);
      if (rows.length === 0) {
        toast.error("CSV contains no data rows.");
        setParsedRows([]);
        return;
      }
      setParsedRows(rows);
      const nextReport = await dryRunTier1LibraryImport({
        targetTable,
        rows,
        ...metaParams,
        importedBy: user?.id ?? null,
      });
      setReport(nextReport);
      toast.message(
        `Dry run complete: ${nextReport.rows_valid} valid, ${nextReport.rows_warning} warning, ${nextReport.rows_invalid} invalid.`,
      );
    } catch (error) {
      toast.error((error as Error).message || "CSV parse failure");
      setParsedRows([]);
    } finally {
      setDryRunning(false);
    }
  };

  const handleStage = async () => {
    if (!report || parsedRows.length === 0 || !targetTable) return;
    setStaging(true);
    setStageMessage(null);
    try {
      const staged = await stageTier1LibraryImport({
        supabase: supabase as unknown as SupabaseLikeClient,
        targetTable,
        rows: parsedRows,
        ...metaParams,
        importedBy: user?.id ?? null,
      });
      setReport(staged);
      if (staged.stageErrors.length > 0) {
        toast.error(staged.stageErrors[0].message);
      } else {
        toast.success(`Staged ${staged.stagedCount} row${staged.stagedCount === 1 ? "" : "s"}.`);
        setStageMessage("Rows staged successfully. Review and apply them from the existing Review Queue.");
        onStaged?.();
      }
    } catch (error) {
      const message = (error as Error).message || "Staging failure";
      toast.error(message);
      setReport((current) =>
        current ? { ...current, stageErrors: [{ message }], stagedCount: current.stagedCount ?? 0 } : current
      );
    } finally {
      setStaging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg">Tier 1 Library Import</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Stage canonical library rows for review without applying them to live tables.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Database className="h-3.5 w-3.5" />
            staged_changes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tier1-target">Target table</Label>
            <Select
              value={targetTable}
              onValueChange={(value) => {
                setTargetTable(value);
                setReport(null);
                setStageMessage(null);
              }}
            >
              <SelectTrigger id="tier1-target">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.tableName} value={target.tableName}>
                    {target.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTarget && (
              <div className="text-xs text-muted-foreground">
                Required: {selectedTarget.requiredFields.map((field) => <code key={field}>{field} </code>)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tier1-source-dataset">Source dataset</Label>
              <Input
                id="tier1-source-dataset"
                value={sourceMeta.sourceDataset}
                onChange={(event) => setSourceMeta((prev) => ({ ...prev, sourceDataset: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier1-source-sheet">Source sheet</Label>
              <Input
                id="tier1-source-sheet"
                value={sourceMeta.sourceSheet}
                onChange={(event) => setSourceMeta((prev) => ({ ...prev, sourceSheet: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier1-source-url">Source URL</Label>
              <Input
                id="tier1-source-url"
                value={sourceMeta.sourceUrl}
                onChange={(event) => setSourceMeta((prev) => ({ ...prev, sourceUrl: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier1-source-sheet-id">Source sheet ID</Label>
              <Input
                id="tier1-source-sheet-id"
                value={sourceMeta.sourceSheetId}
                onChange={(event) => setSourceMeta((prev) => ({ ...prev, sourceSheetId: event.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tier1-csv">CSV rows</Label>
          <Textarea
            id="tier1-csv"
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              setStageMessage(null);
            }}
            placeholder="quote_text,source_text,theme_tags,ao_tags&#10;“Facts alone are wanted in life.”,Hard Times,education; childhood,AO2|AO3"
            className="min-h-44 font-mono text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDryRun} disabled={dryRunning || staging}>
            {dryRunning ? "Checking..." : "Dry Run"}
          </Button>
          <Button onClick={handleStage} disabled={!canStage || dryRunning || staging}>
            <Send className="h-4 w-4 mr-1.5" />
            {staging ? "Staging..." : "Stage Valid Rows"}
          </Button>
        </div>

        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ["Total", report.rows_total],
                ["Valid", report.rows_valid],
                ["Warning", report.rows_warning],
                ["Invalid", report.rows_invalid],
                ["Staged", report.stagedCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-2xl font-semibold tabular-nums">{value}</div>
                </div>
              ))}
            </div>

            {stageMessage && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {stageMessage}
                  {report.importLogId && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Import log: <code>{report.importLogId}</code>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {report.stageErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{report.stageErrors.map((error) => error.message).join("; ")}</AlertDescription>
              </Alert>
            )}

            {report.rows_invalid > 0 && (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertDescription>
                  {report.rows_invalid} row{report.rows_invalid === 1 ? "" : "s"} will not be staged.
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content hash</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Unmapped fields</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.preparedRows.slice(0, 10).map((row) => (
                  <TableRow key={`${row.sourceRowNumber}-${row.contentHash}`}>
                    <TableCell className="tabular-nums">{row.sourceRowNumber}</TableCell>
                    <TableCell>
                      <Badge variant={row.validationStatus === "valid" ? "default" : "outline"}>
                        {row.validationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell><code className="text-xs">{row.contentHash}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.validationWarnings.length > 0 ? row.validationWarnings.map(issueText).join("; ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unmappedFields(row.normalizedPayload).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {report.invalidRows.slice(0, 10).map((row) => (
                  <TableRow key={`${row.sourceRowNumber}-invalid`}>
                    <TableCell className="tabular-nums">{row.sourceRowNumber}</TableCell>
                    <TableCell><Badge variant="destructive">invalid</Badge></TableCell>
                    <TableCell><code className="text-xs">{row.contentHash ?? "—"}</code></TableCell>
                    <TableCell className="text-xs text-destructive">
                      {row.validationErrors.map(issueText).join("; ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {unmappedFields(row.normalizedPayload).join(", ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {report.preparedRows.length > 0 && (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">Sample prepared rows</summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(report.preparedRows.slice(0, 3), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
