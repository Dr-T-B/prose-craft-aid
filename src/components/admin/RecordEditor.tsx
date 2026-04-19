import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Save, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// --- Editable table config ---------------------------------------------------

export type EditableTableKey =
  | "questions"
  | "quote_methods"
  | "theme_maps"
  | "ao5_tensions";

export type FieldKind = "text" | "textarea" | "tags" | "select";

/**
 * Where to derive controlled-vocabulary options from.
 * - `{ kind: "distinct", column }` → distinct values of `column` in the same table
 * - `{ kind: "table", table, valueColumn, labelColumn? }` → rows from a related table
 */
export type OptionsSource =
  | { kind: "distinct"; column: string }
  | { kind: "table"; table: "routes"; valueColumn: string; labelColumn?: string };

export interface EditableFieldConfig {
  field: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Warn if length < this */
  minLength?: number;
  /** Warn if length > this */
  maxLength?: number;
  /** Optional controlled-vocabulary source (only meaningful for kind: "select") */
  optionsFrom?: OptionsSource;
}

export interface EditableTableConfig {
  table: EditableTableKey;
  displayName: string;
  fields: EditableFieldConfig[];
}

export const EDITABLE_TABLE_CONFIG: Record<EditableTableKey, EditableTableConfig> = {
  questions: {
    table: "questions",
    displayName: "Questions Engine",
    fields: [
      { field: "stem", label: "Question stem", kind: "textarea", required: true, minLength: 20 },
      {
        field: "family",
        label: "Question family",
        kind: "select",
        required: true,
        minLength: 2,
        optionsFrom: { kind: "distinct", column: "family" },
      },
      {
        field: "level_tag",
        label: "Level",
        kind: "select",
        required: true,
        minLength: 1,
        optionsFrom: { kind: "distinct", column: "level_tag" },
      },
      {
        field: "primary_route_id",
        label: "Primary route",
        kind: "select",
        required: true,
        optionsFrom: { kind: "table", table: "routes", valueColumn: "id", labelColumn: "name" },
      },
      {
        field: "secondary_route_id",
        label: "Secondary route",
        kind: "select",
        optionsFrom: { kind: "table", table: "routes", valueColumn: "id", labelColumn: "name" },
      },
      { field: "likely_core_methods", label: "Likely core methods", kind: "tags" },
    ],
  },
  quote_methods: {
    table: "quote_methods",
    displayName: "Quote + Method Bank",
    fields: [
      { field: "quote_text", label: "Quote", kind: "textarea", required: true, minLength: 5, maxLength: 500 },
      { field: "method", label: "Method", kind: "text", required: true, minLength: 2 },
      {
        field: "source_text",
        label: "Source text",
        kind: "select",
        required: true,
        optionsFrom: { kind: "distinct", column: "source_text" },
      },
      {
        field: "level_tag",
        label: "Level",
        kind: "select",
        required: true,
        optionsFrom: { kind: "distinct", column: "level_tag" },
      },
      { field: "meaning_prompt", label: "Meaning prompt", kind: "textarea", minLength: 10 },
      { field: "effect_prompt", label: "Effect prompt", kind: "textarea", minLength: 10 },
      { field: "best_themes", label: "Best themes", kind: "tags" },
    ],
  },
  theme_maps: {
    table: "theme_maps",
    displayName: "Theme Maps",
    fields: [
      {
        field: "family",
        label: "Theme family",
        kind: "select",
        required: true,
        minLength: 2,
        optionsFrom: { kind: "distinct", column: "family" },
      },
      { field: "one_line", label: "Concept summary", kind: "textarea", required: true, minLength: 15 },
    ],
  },
  ao5_tensions: {
    table: "ao5_tensions",
    displayName: "AO5 Interpretation Engine",
    fields: [
      { field: "focus", label: "Focus / debate", kind: "text", required: true, minLength: 4 },
      { field: "dominant_reading", label: "Dominant reading", kind: "textarea", required: true, minLength: 15 },
      { field: "alternative_reading", label: "Alternative reading", kind: "textarea", required: true, minLength: 15 },
      { field: "safe_stem", label: "Safe stem", kind: "textarea" },
      {
        field: "level_tag",
        label: "Level",
        kind: "select",
        required: true,
        optionsFrom: { kind: "distinct", column: "level_tag" },
      },
      { field: "best_use", label: "Best use", kind: "tags" },
    ],
  },
};

export function isEditableTable(key: string): key is EditableTableKey {
  return key in EDITABLE_TABLE_CONFIG;
}

// --- Controlled-vocabulary options -----------------------------------------

export interface ControlledOption {
  value: string;
  label: string;
}

/** Sentinel used inside the Select UI to represent "clear / no selection".
 *  Radix Select forbids "" as an item value, so we map this back to "" on change. */
const CLEAR_SELECT_VALUE = "__clear__";

/**
 * Loads controlled-vocabulary options for every `select` field in a config.
 * - distinct → reads distinct non-null values from the same table
 * - table    → reads id+label rows from the related table (currently `routes`)
 * On failure, falls back to an empty option list; the editor still renders the
 * raw saved value safely so legacy values are never silently erased.
 */
function useControlledOptions(
  config: EditableTableConfig | null,
): { options: Record<string, ControlledOption[]>; loading: boolean } {
  const [options, setOptions] = useState<Record<string, ControlledOption[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config) {
      setOptions({});
      return;
    }
    const selectFields = config.fields.filter(
      (f) => f.kind === "select" && f.optionsFrom,
    );
    if (selectFields.length === 0) {
      setOptions({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const next: Record<string, ControlledOption[]> = {};

      const needsRoutes = selectFields.some(
        (f) => f.optionsFrom?.kind === "table" && f.optionsFrom.table === "routes",
      );
      let routeRows: Array<{ id: string; name: string | null }> = [];
      if (needsRoutes) {
        const { data, error } = await supabase
          .from("routes")
          .select("id, name")
          .order("name", { ascending: true });
        if (!error && data) {
          routeRows = data as Array<{ id: string; name: string | null }>;
        }
      }

      await Promise.all(
        selectFields.map(async (f) => {
          const src = f.optionsFrom!;
          if (src.kind === "table" && src.table === "routes") {
            next[f.field] = routeRows
              .filter((r) => typeof r.id === "string" && r.id.length > 0)
              .map((r) => ({
                value: r.id,
                label: r.name ? `${r.name} · ${r.id}` : r.id,
              }));
            return;
          }
          if (src.kind === "distinct") {
            const { data, error } = await supabase
              .from(config.table as never)
              .select(src.column as never)
              .limit(1000);
            if (error || !data) {
              next[f.field] = [];
              return;
            }
            const seen = new Set<string>();
            (data as Array<Record<string, unknown>>).forEach((row) => {
              const raw = row[src.column];
              if (typeof raw !== "string") return;
              const v = raw.trim();
              if (!v) return;
              seen.add(v);
            });
            next[f.field] = Array.from(seen)
              .sort((a, b) => a.localeCompare(b))
              .map((v) => ({ value: v, label: v }));
          }
        }),
      );

      if (!cancelled) {
        setOptions(next);
        setLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [config]);

  return { options, loading };
}

// --- Validation -------------------------------------------------------------

const PLACEHOLDER_TOKENS = ["test", "todo", "tbc", "tbd", "lorem", "n/a", "placeholder", "sample", "draft", "xxx"];

interface FieldIssue {
  field: string;
  level: "error" | "warning";
  message: string;
}

function looksLikePlaceholder(s: string): boolean {
  const t = s.trim().toLowerCase();
  if (!t) return false;
  if (PLACEHOLDER_TOKENS.includes(t)) return true;
  if (t.length < 50) {
    return PLACEHOLDER_TOKENS.some((tok) => {
      const re = new RegExp(`(^|[^a-z])${tok}([^a-z]|$)`, "i");
      return re.test(t);
    });
  }
  return false;
}

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function validate(
  config: EditableTableConfig,
  values: Record<string, unknown>,
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  config.fields.forEach((f) => {
    const v = values[f.field];
    const filled = isFilled(v);

    if (f.required && !filled) {
      issues.push({ field: f.field, level: "error", message: `${f.label} is required.` });
      return;
    }
    if (!filled) return;

    if (f.kind === "tags") {
      // tags: array of non-empty strings
      if (!Array.isArray(v)) {
        issues.push({ field: f.field, level: "error", message: `${f.label} must be a list.` });
      }
      return;
    }

    const text = String(v);
    if (looksLikePlaceholder(text)) {
      issues.push({
        field: f.field,
        level: "warning",
        message: `${f.label} looks like placeholder text.`,
      });
    }
    if (f.minLength !== undefined && text.trim().length < f.minLength) {
      issues.push({
        field: f.field,
        level: "warning",
        message: `${f.label} is very short (${text.trim().length} chars, expected ≥ ${f.minLength}).`,
      });
    }
    if (f.maxLength !== undefined && text.length > f.maxLength) {
      issues.push({
        field: f.field,
        level: "warning",
        message: `${f.label} is unusually long (${text.length} chars, expected ≤ ${f.maxLength}).`,
      });
    }
  });
  return issues;
}

// --- Helpers ----------------------------------------------------------------

function toFormValue(field: EditableFieldConfig, raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (field.kind === "tags") {
    if (Array.isArray(raw)) return raw.join(", ");
    return String(raw);
  }
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

function fromFormValue(field: EditableFieldConfig, str: string): unknown {
  if (field.kind === "tags") {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return str;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => x === b[i]);
  }
  return false;
}

// --- Component --------------------------------------------------------------

export interface RecordEditorProps {
  open: boolean;
  table: EditableTableKey | null;
  record: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: (updated: Record<string, unknown>) => void;
}

export default function RecordEditor({
  open,
  table,
  record,
  onClose,
  onSaved,
}: RecordEditorProps) {
  const config = table ? EDITABLE_TABLE_CONFIG[table] : null;

  const initialValues = useMemo(() => {
    if (!config || !record) return {};
    const out: Record<string, string> = {};
    config.fields.forEach((f) => {
      out[f.field] = toFormValue(f, record[f.field]);
    });
    return out;
  }, [config, record]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [showRawJson, setShowRawJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmWarnings, setConfirmWarnings] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [savedFields, setSavedFields] = useState<string[]>([]);

  useEffect(() => {
    setValues(initialValues);
    setShowRawJson(false);
    setSavedFields([]);
  }, [initialValues]);

  const dirtyFields = useMemo(() => {
    if (!config || !record) return [] as string[];
    return config.fields
      .filter((f) => {
        const original = toFormValue(f, record[f.field]);
        return values[f.field] !== original;
      })
      .map((f) => f.field);
  }, [config, record, values]);

  const isDirty = dirtyFields.length > 0;

  const parsedValues = useMemo(() => {
    if (!config) return {};
    const out: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      out[f.field] = fromFormValue(f, values[f.field] ?? "");
    });
    return out;
  }, [config, values]);

  const issues = useMemo(() => {
    if (!config) return [];
    return validate(config, parsedValues);
  }, [config, parsedValues]);

  const errorIssues = issues.filter((i) => i.level === "error");
  const warningIssues = issues.filter((i) => i.level === "warning");
  const issueByField = useMemo(() => {
    const map: Record<string, FieldIssue[]> = {};
    issues.forEach((i) => {
      map[i.field] = map[i.field] ?? [];
      map[i.field].push(i);
    });
    return map;
  }, [issues]);

  const handleClose = () => {
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleReset = () => {
    setValues(initialValues);
  };

  const performSave = async () => {
    if (!config || !record) return;
    setSaving(true);

    // Build update payload using ONLY allowed fields, and only those that changed
    const payload: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      const newVal = parsedValues[f.field];
      const oldVal =
        f.kind === "tags"
          ? Array.isArray(record[f.field])
            ? (record[f.field] as unknown[])
            : []
          : record[f.field];
      if (!shallowEqual(newVal, oldVal)) {
        payload[f.field] = newVal;
      }
    });

    if (Object.keys(payload).length === 0) {
      toast({ title: "Nothing to save", description: "No fields were changed." });
      setSaving(false);
      return;
    }

    const id = record.id;
    if (id === undefined || id === null) {
      toast({
        title: "Unable to update record",
        description: "Missing record id.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from(config.table as never)
      .update(payload as never)
      .eq("id", id as never)
      .select()
      .maybeSingle();

    setSaving(false);

    if (error) {
      const msg = error.message || "Save failed.";
      const isPerm = /permission|policy|rls/i.test(msg);
      toast({
        title: "Unable to update record",
        description: isPerm
          ? "You may not have admin permissions for this table."
          : msg,
        variant: "destructive",
      });
      return;
    }

    if (!data) {
      toast({
        title: "Record not updated",
        description: "Record may have been removed or you don't have permission.",
        variant: "destructive",
      });
      return;
    }

    setSavedFields(Object.keys(payload));
    toast({ title: "Record updated", description: `${Object.keys(payload).length} field(s) saved.` });
    onSaved(data as Record<string, unknown>);
  };

  const handleSaveClick = () => {
    if (errorIssues.length > 0) return;
    if (warningIssues.length > 0) {
      setConfirmWarnings(true);
      return;
    }
    void performSave();
  };

  if (!config || !record) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-[10px] uppercase">
                Editing · {config.displayName}
              </Badge>
              {isDirty && (
                <Badge className="bg-[hsl(var(--warning,38_92%_50%))] text-[hsl(var(--warning-foreground,0_0%_100%))] hover:bg-[hsl(var(--warning,38_92%_50%))]">
                  Unsaved changes ({dirtyFields.length})
                </Badge>
              )}
            </div>
            <SheetTitle className="text-left">
              {String(record[config.fields[0].field] ?? record.id ?? "Record")}
            </SheetTitle>
            <SheetDescription className="text-left font-mono text-xs">
              {String(record.id ?? "—")}
            </SheetDescription>
          </SheetHeader>

          {/* Validation summary */}
          {(errorIssues.length > 0 || warningIssues.length > 0) && (
            <div className="mt-4 space-y-2">
              {errorIssues.length > 0 && (
                <div className="border border-destructive/40 bg-destructive/5 rounded-md p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errorIssues.length} error{errorIssues.length > 1 ? "s" : ""} must be fixed
                  </div>
                  <ul className="text-xs text-muted-foreground pl-6 list-disc space-y-0.5">
                    {errorIssues.map((i, idx) => (
                      <li key={idx}>{i.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warningIssues.length > 0 && (
                <div className="border border-border bg-muted/40 rounded-md p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    {warningIssues.length} warning{warningIssues.length > 1 ? "s" : ""}
                  </div>
                  <ul className="text-xs text-muted-foreground pl-6 list-disc space-y-0.5">
                    {warningIssues.map((i, idx) => (
                      <li key={idx}>{i.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Fields */}
          <div className="py-4 space-y-4">
            {config.fields.map((f) => {
              const fieldIssues = issueByField[f.field] ?? [];
              const hasError = fieldIssues.some((i) => i.level === "error");
              const hasWarning = fieldIssues.some((i) => i.level === "warning");
              const isDirtyField = dirtyFields.includes(f.field);
              const wasSaved = savedFields.includes(f.field);

              return (
                <div key={f.field} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`field-${f.field}`} className="text-xs font-medium uppercase tracking-wide">
                      {f.label}
                      {f.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{f.field}</span>
                    {isDirtyField && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        Modified
                      </Badge>
                    )}
                    {wasSaved && !isDirtyField && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        Saved
                      </Badge>
                    )}
                  </div>

                  {f.kind === "textarea" ? (
                    <Textarea
                      id={`field-${f.field}`}
                      value={values[f.field] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [f.field]: e.target.value }))}
                      rows={4}
                      className={
                        hasError
                          ? "border-destructive focus-visible:ring-destructive"
                          : hasWarning
                            ? "border-[hsl(var(--warning,38_92%_50%))]"
                            : ""
                      }
                    />
                  ) : (
                    <Input
                      id={`field-${f.field}`}
                      value={values[f.field] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.kind === "tags" ? "comma, separated, values" : ""}
                      className={
                        hasError
                          ? "border-destructive focus-visible:ring-destructive"
                          : hasWarning
                            ? "border-[hsl(var(--warning,38_92%_50%))]"
                            : ""
                      }
                    />
                  )}

                  {fieldIssues.length > 0 && (
                    <div className="space-y-0.5">
                      {fieldIssues.map((i, idx) => (
                        <p
                          key={idx}
                          className={`text-xs ${i.level === "error" ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {i.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Raw JSON toggle */}
          <div className="border-t pt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowRawJson((v) => !v)}>
              {showRawJson ? "Hide" : "Show"} raw record JSON
            </Button>
            {showRawJson && (
              <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(record, null, 2)}
              </pre>
            )}
          </div>

          {/* Action bar */}
          <div className="sticky bottom-0 -mx-6 px-6 py-3 mt-4 border-t bg-background flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || saving}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={saving}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={!isDirty || saving || errorIssues.length > 0}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Warnings confirmation */}
      <AlertDialog open={confirmWarnings} onOpenChange={setConfirmWarnings}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save with warnings?</AlertDialogTitle>
            <AlertDialogDescription>
              This record has {warningIssues.length} validation warning
              {warningIssues.length > 1 ? "s" : ""}. You can still save, but please confirm
              the content is intentional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmWarnings(false);
                void performSave();
              }}
            >
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard confirmation */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {dirtyFields.length} unsaved field
              {dirtyFields.length > 1 ? "s" : ""}. Closing will lose these changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
