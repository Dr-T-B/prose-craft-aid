import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertTriangle, FileWarning, Clock, Download } from "lucide-react";
import { type DatasetMeta } from "@/lib/datasets";
import { dryRunCsv, importCsv, parseCsv, validateHeaders, type ImportResult, type ParsedCsv } from "@/lib/csvImport";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ImportPanelProps {
  meta: DatasetMeta;
  rowCount: number | null;
  lastImport: { created_at: string; inserted_count: number; updated_count: number; error_count: number } | null;
  onImported: () => void;
}

export default function ImportPanel({ meta, rowCount, lastImport, onImported }: ImportPanelProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof validateHeaders> | null>(null);
  const [importing, setImporting] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultMode, setResultMode] = useState<"dry" | "live" | null>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setValidation(null);
    setResult(null);
    setResultMode(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    try {
      const p = await parseCsv(f);
      setParsed(p);
      setValidation(validateHeaders(p.headers, meta));
    } catch (e) {
      toast.error(`Could not parse CSV: ${(e as Error).message}`);
      reset();
    }
  };

  const canImport =
    !!parsed && !!validation && validation.hasIdColumn && validation.missingRequired.length === 0;

  const handleDryRun = async () => {
    if (!parsed) return;
    setDryRunning(true);
    try {
      const r = await dryRunCsv(meta, parsed);
      setResult(r);
      setResultMode("dry");
      toast.message(`Dry run: ${r.inserted} would insert, ${r.updated} would update`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDryRunning(false);
    }
  };

  const handleImport = async () => {
    if (!file || !parsed) return;
    setImporting(true);
    try {
      const r = await importCsv(file, meta, parsed, user?.id ?? null);
      setResult(r);
      setResultMode("live");
      toast.success(`Imported ${meta.label}: ${r.inserted} new, ${r.updated} updated`);
      onImported();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const exportIssues = () => {
    if (!result || result.errors.length === 0) return;
    const mode = resultMode === "dry" ? "dry_run" : "live_import";
    const timestamp = new Date().toISOString();
    const escape = (v: unknown) => {
      const s = v === undefined || v === null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["dataset", "mode", "row_number", "id", "message", "field_name", "raw_value", "timestamp"];
    const lines = [headers.join(",")];
    for (const e of result.errors) {
      lines.push([
        meta.key,
        mode,
        e.row,
        e.id ?? "",
        e.message,
        e.field ?? "",
        e.rawValue ?? "",
        timestamp,
      ].map(escape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fnameTs = timestamp.replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.key}-issues-${mode}-${fnameTs}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{meta.label}</CardTitle>
              <Badge
                variant="outline"
                className={
                  meta.tier === "content"
                    ? "text-[10px] uppercase tracking-wide border-primary/40 text-primary"
                    : "text-[10px] uppercase tracking-wide border-accent/60 bg-accent/10"
                }
              >
                {meta.tier === "content" ? "Content" : "User-state"}
              </Badge>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                id: {meta.idType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
          </div>
          <Badge variant="secondary" className="tabular-nums shrink-0">
            {rowCount ?? "—"} rows
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {lastImport
            ? `Last import: ${new Date(lastImport.created_at).toLocaleString()} · +${lastImport.inserted_count} / ↻${lastImport.updated_count}${
                lastImport.error_count ? ` / !${lastImport.error_count}` : ""
              }`
            : "No imports yet"}
        </div>

        <div className="text-xs text-muted-foreground">
          Required columns:{" "}
          <code className="text-foreground">id</code>
          {meta.requiredColumns.map((c) => (
            <span key={c}>
              , <code className="text-foreground">{c}</code>
            </span>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {!file && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDragging) setIsDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (!f) return;
              const isCsv =
                f.type === "text/csv" ||
                f.type === "application/vnd.ms-excel" ||
                f.name.toLowerCase().endsWith(".csv");
              if (!isCsv) {
                toast.error("Please drop a .csv file");
                return;
              }
              handleFile(f);
            }}
            className={`w-full rounded-md border-2 border-dashed px-4 py-6 text-center text-sm cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Upload className={`h-5 w-5 mx-auto mb-1.5 ${isDragging ? "text-primary" : ""}`} />
            <div className="font-medium">
              {isDragging ? "Drop CSV to upload" : "Drop CSV here or click to choose"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">.csv files only</div>
          </div>
        )}

        {file && parsed && validation && (
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="text-xs font-medium truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {parsed.rows.length} rows · {parsed.headers.length} columns
            </div>

            {!validation.hasIdColumn && (
              <Alert variant="destructive" className="py-2">
                <FileWarning className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Missing required <code>id</code> column. Add an <code>id</code> column to the CSV before importing.
                </AlertDescription>
              </Alert>
            )}
            {validation.missingRequired.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <FileWarning className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Missing required columns: {validation.missingRequired.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs">
              <div className="font-medium mb-1">Headers preview:</div>
              <div className="flex flex-wrap gap-1">
                {parsed.headers.map((h) => (
                  <Badge key={h} variant={h === "id" ? "default" : "outline"} className="text-xs font-normal">
                    {h}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDryRun}
                disabled={!canImport || dryRunning || importing}
              >
                {dryRunning ? "Checking…" : "Dry run"}
              </Button>
              <Button size="sm" onClick={handleImport} disabled={!canImport || importing || dryRunning}>
                {importing ? "Importing…" : "Upsert by id"}
              </Button>
              <Button size="sm" variant="ghost" onClick={reset} disabled={importing || dryRunning}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {result && (
          <Alert className="py-2">
            {result.errors.length === 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={resultMode === "dry" ? "outline" : "default"}
                  className="text-[10px] uppercase"
                >
                  {resultMode === "dry" ? "Dry run · no writes" : "Imported"}
                </Badge>
                <span className="text-muted-foreground">
                  {parsed ? `${parsed.rows.length} rows analysed` : ""}
                </span>
              </div>
              <strong>{result.inserted}</strong> {resultMode === "dry" ? "would insert" : "inserted"} ·{" "}
              <strong>{result.updated}</strong> {resultMode === "dry" ? "would update" : "updated"} ·{" "}
              <strong>{result.skipped}</strong> {resultMode === "dry" ? "would skip" : "skipped"} ·{" "}
              <strong>{result.errors.length}</strong> {resultMode === "dry" ? "would error" : "errors"}
              {result.errors.length > 0 && (
                <>
                  <details className="mt-1" open={resultMode === "dry"}>
                    <summary className="cursor-pointer">First {Math.min(20, result.errors.length)} issues</summary>
                    <ul className="mt-1 space-y-0.5 max-h-40 overflow-auto pl-3 list-disc">
                      {result.errors.slice(0, 20).map((e, i) => {
                        const truncate = (s: string) => (s.length > 60 ? `${s.slice(0, 57)}…` : s);
                        return (
                          <li key={i}>
                            <span className="text-foreground">Row {e.row}</span>
                            {e.id ? <span className="text-muted-foreground"> ({e.id})</span> : ""}
                            {e.field ? (
                              <span className="text-muted-foreground">
                                {" · "}
                                <code className="text-foreground">{e.field}</code>
                              </span>
                            ) : null}
                            : {e.message}
                            {e.rawValue !== undefined && e.rawValue !== "" ? (
                              <span className="text-muted-foreground">
                                {" — got "}
                                <code className="text-foreground break-all">{truncate(e.rawValue)}</code>
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={exportIssues}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export {result.errors.length} issue{result.errors.length === 1 ? "" : "s"} to CSV
                  </Button>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
