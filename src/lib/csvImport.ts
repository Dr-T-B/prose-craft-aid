import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { isUuid, type DatasetMeta } from "./datasets";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; id?: string; message: string; field?: string; rawValue?: string }[];
}

export function parseCsv(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        resolve({ headers, rows: res.data });
      },
      error: reject,
    });
  });
}

export interface ValidationReport {
  hasIdColumn: boolean;
  missingRequired: string[];
  rowCount: number;
}

export function validateHeaders(headers: string[], meta: DatasetMeta): ValidationReport {
  const set = new Set(headers.map((h) => h.trim()));
  const missingRequired = meta.requiredColumns.filter((c) => !set.has(c));
  return {
    hasIdColumn: set.has("id"),
    missingRequired,
    rowCount: 0,
  };
}

const TIMESTAMP_COLS = new Set(["created_at", "updated_at"]);

function parseBool(v: string): boolean | null {
  const s = v.trim().toLowerCase();
  if (["true", "t", "1", "yes", "y"].includes(s)) return true;
  if (["false", "f", "0", "no", "n"].includes(s)) return false;
  return null;
}

export interface CellIssue {
  field: string;
  message: string;
  rawValue: string;
}

function coerceRow(
  raw: Record<string, string>,
  meta: DatasetMeta,
  issues?: CellIssue[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = k.trim();
    // Ignore CSV-managed timestamp columns — the DB owns these.
    if (TIMESTAMP_COLS.has(key)) continue;

    if (v === undefined || v === null || String(v).trim() === "") {
      out[key] = null;
      continue;
    }
    const val = String(v).trim();

    if (meta.arrayColumns?.includes(key)) {
      if (val.startsWith("[")) {
        try {
          out[key] = JSON.parse(val);
          continue;
        } catch {
          /* fall through to delimiter split */
        }
      }
      out[key] = val.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    } else if (meta.jsonColumns?.includes(key)) {
      try {
        out[key] = JSON.parse(val);
      } catch {
        out[key] = null;
        issues?.push({ field: key, message: "Invalid JSON/jsonb value", rawValue: val });
      }
    } else if (meta.integerColumns?.includes(key)) {
      const n = parseInt(val, 10);
      if (Number.isFinite(n) && /^-?\d+$/.test(val)) {
        out[key] = n;
      } else {
        out[key] = null;
        issues?.push({ field: key, message: "Invalid integer", rawValue: val });
      }
    } else if (meta.booleanColumns?.includes(key)) {
      const b = parseBool(val);
      out[key] = b;
      if (b === null) {
        issues?.push({ field: key, message: "Invalid boolean", rawValue: val });
      }
    } else if (meta.uuidColumns?.includes(key)) {
      if (isUuid(val)) {
        out[key] = val;
      } else {
        out[key] = null;
        issues?.push({ field: key, message: `Invalid uuid in ${key}`, rawValue: val });
      }
    } else if (meta.timestampColumns?.includes(key)) {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) {
        out[key] = null;
        issues?.push({ field: key, message: "Invalid timestamp", rawValue: val });
      } else {
        out[key] = d.toISOString();
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Upsert rows by `id`. Reports which were inserted vs updated by looking up
 * existing ids first, then upserting in batches.
 */
export async function importCsv(
  file: File,
  meta: DatasetMeta,
  parsed: ParsedCsv,
  importedBy: string | null,
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  if (!parsed.headers.includes("id")) {
    throw new Error("CSV is missing required `id` column.");
  }
  for (const col of meta.requiredColumns) {
    if (!parsed.headers.includes(col)) {
      result.errors.push({ row: 0, field: col, message: `CSV is missing required column: ${col}` });
    }
  }

  const prepared: { row: Record<string, unknown>; index: number }[] = [];
  parsed.rows.forEach((raw, i) => {
    const rowNum = i + 2;
    const idRaw = (raw.id ?? "").toString();
    const id = idRaw.trim();
    if (!id) {
      result.skipped += 1;
      result.errors.push({ row: rowNum, field: "id", message: "Missing id", rawValue: idRaw });
      return;
    }
    if (meta.idType === "uuid" && !isUuid(id)) {
      result.skipped += 1;
      result.errors.push({ row: rowNum, id, field: "id", message: "Invalid uuid in id column", rawValue: idRaw });
      return;
    }
    const cellIssues: CellIssue[] = [];
    const coerced = coerceRow(raw, meta, cellIssues);
    coerced.id = id;
    for (const ci of cellIssues) {
      result.errors.push({ row: rowNum, id, field: ci.field, message: ci.message, rawValue: ci.rawValue });
    }
    prepared.push({ row: coerced, index: rowNum });
  });

  if (prepared.length === 0) {
    await logImport(meta.key, file.name, result, importedBy);
    return result;
  }

  const ids = prepared.map((p) => String(p.row.id));
  const { data: existingRows, error: existingErr } = await supabase
    .from(meta.key as never)
    .select("id")
    .in("id", ids);

  if (existingErr) {
    result.errors.push({ row: 0, message: `Lookup failed: ${existingErr.message}` });
    await logImport(meta.key, file.name, result, importedBy);
    return result;
  }

  const existingSet = new Set((existingRows ?? []).map((r: { id: string }) => r.id));

  const BATCH = 500;
  for (let i = 0; i < prepared.length; i += BATCH) {
    const slice = prepared.slice(i, i + BATCH);
    const payload = slice.map((p) => p.row);
    const { error } = await supabase
      .from(meta.key as never)
      .upsert(payload as never, { onConflict: "id" });

    if (error) {
      slice.forEach((p) => {
        result.errors.push({ row: p.index, id: String(p.row.id), message: error.message });
      });
      continue;
    }

    for (const p of slice) {
      if (existingSet.has(String(p.row.id))) result.updated += 1;
      else result.inserted += 1;
    }
  }

  await logImport(meta.key, file.name, result, importedBy);
  return result;
}

async function logImport(
  dataset: string,
  filename: string,
  result: ImportResult,
  importedBy: string | null,
) {
  // Persist the full enriched issue shape (row/id/field/message/rawValue)
  // so logs can be re-exported later with the same context as the live UI.
  const enrichedErrors = result.errors.slice(0, 100).map((e) => ({
    row: e.row,
    id: e.id ?? null,
    field: e.field ?? null,
    message: e.message,
    rawValue: e.rawValue ?? null,
  }));
  await supabase.from("import_logs").insert({
    dataset,
    filename,
    inserted_count: result.inserted,
    updated_count: result.updated,
    skipped_count: result.skipped,
    error_count: result.errors.length,
    errors: enrichedErrors,
    imported_by: importedBy,
  } as never);
}

/**
 * Dry-run: parse, validate, coerce, and classify rows without writing
 * to the destination table or to import_logs.
 */
export async function dryRunCsv(
  meta: DatasetMeta,
  parsed: ParsedCsv,
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  if (!parsed.headers.includes("id")) {
    throw new Error("CSV is missing required `id` column.");
  }
  for (const col of meta.requiredColumns) {
    if (!parsed.headers.includes(col)) {
      result.errors.push({ row: 0, field: col, message: `CSV is missing required column: ${col}` });
    }
  }

  const prepared: { id: string; index: number }[] = [];
  parsed.rows.forEach((raw, i) => {
    const rowNum = i + 2;
    const idRaw = (raw.id ?? "").toString();
    const id = idRaw.trim();
    if (!id) {
      result.skipped += 1;
      result.errors.push({ row: rowNum, field: "id", message: "Missing id", rawValue: idRaw });
      return;
    }
    if (meta.idType === "uuid" && !isUuid(id)) {
      result.skipped += 1;
      result.errors.push({ row: rowNum, id, field: "id", message: "Invalid uuid in id column", rawValue: idRaw });
      return;
    }
    // Run coercion to surface any per-cell issues (jsonb/uuid/timestamp/integer/boolean)
    const cellIssues: CellIssue[] = [];
    try {
      coerceRow(raw, meta, cellIssues);
    } catch (e) {
      result.skipped += 1;
      result.errors.push({ row: rowNum, id, message: (e as Error).message });
      return;
    }
    for (const ci of cellIssues) {
      result.errors.push({ row: rowNum, id, field: ci.field, message: ci.message, rawValue: ci.rawValue });
    }
    prepared.push({ id, index: rowNum });
  });

  // Detect duplicate ids within the CSV itself (same id twice in one upload)
  const seen = new Map<string, number>();
  for (const p of prepared) {
    const prev = seen.get(p.id);
    if (prev !== undefined) {
      result.errors.push({
        row: p.index,
        id: p.id,
        message: `Duplicate id in CSV (also at row ${prev})`,
      });
    }
    seen.set(p.id, p.index);
  }

  if (prepared.length === 0) return result;

  const ids = prepared.map((p) => p.id);
  const { data: existingRows, error: existingErr } = await supabase
    .from(meta.key as never)
    .select("id")
    .in("id", ids);

  if (existingErr) {
    result.errors.push({ row: 0, message: `Lookup failed: ${existingErr.message}` });
    return result;
  }

  const existingSet = new Set((existingRows ?? []).map((r: { id: string }) => r.id));
  for (const p of prepared) {
    if (existingSet.has(p.id)) result.updated += 1;
    else result.inserted += 1;
  }
  return result;
}
