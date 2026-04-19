// Vocabulary Outlier Audit — read-only governance layer.
//
// This module loads classification field values across known content tables,
// normalizes them for COMPARISON ONLY (it never mutates stored data),
// groups them by normalized form, and produces a flat list of outlier
// findings (case/whitespace drift, punctuation drift, near-duplicates,
// low-frequency values, unknown route references, weak/placeholder
// values, etc.).
//
// Detection profile: CONSERVATIVE.
//   - Levenshtein distance ≤ 2 on values ≥ 5 chars for typo detection.
//   - Case/whitespace/punctuation-only differences are always flagged.
//   - Low-frequency = count ≤ 2 OR < 10% of the field's most common value.

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Audit registry — which (table, field) pairs are controlled vocabulary.
// Only fields that genuinely behave like classification values are listed.
// ---------------------------------------------------------------------------

export type AuditableTable =
  | "questions"
  | "quote_methods"
  | "theme_maps"
  | "ao5_tensions"
  | "theses"
  | "paragraph_jobs"
  | "character_cards"
  | "symbol_entries"
  | "comparative_matrix";

/**
 * Audit mode controls which checks run for a given field.
 *  - "standard"        : full set of checks (default).
 *  - "structural-only" : only structural drift (empty_required, whitespace
 *                        drift, ALL-CAPS-style case drift, placeholder).
 *                        Skip near-duplicate, low-frequency, punctuation drift.
 *                        Use for descriptive prose fields where every value
 *                        is legitimately unique.
 *  - "array-tag"       : audited as an array of tags. Each element is treated
 *                        as a separate value. Empty array counts as empty.
 */
export type AuditMode = "standard" | "structural-only" | "array-tag";

export interface AuditField {
  table: AuditableTable;
  field: string;
  /** Human label for display. */
  label: string;
  /** Soften punctuation when comparing (helpful for tag-like values). */
  softenPunctuation?: boolean;
  /** Resolve against the routes table; flag unknown ids. */
  routeLookup?: boolean;
  /** Required field — empty/placeholder values escalate severity. */
  required?: boolean;
  /** Audit mode (default "standard"). */
  mode?: AuditMode;
}

export const AUDITABLE_FIELDS: AuditField[] = [
  // questions
  { table: "questions", field: "family", label: "Family", required: true, softenPunctuation: true },
  { table: "questions", field: "level_tag", label: "Level tag", required: true, softenPunctuation: true },
  { table: "questions", field: "primary_route_id", label: "Primary route", required: true, routeLookup: true },
  { table: "questions", field: "secondary_route_id", label: "Secondary route", routeLookup: true },
  { table: "questions", field: "likely_core_methods", label: "Likely core methods", required: true, softenPunctuation: true, mode: "array-tag" },
  // quote_methods
  { table: "quote_methods", field: "source_text", label: "Source text", required: true },
  { table: "quote_methods", field: "level_tag", label: "Level tag", required: true, softenPunctuation: true },
  { table: "quote_methods", field: "method", label: "Method (descriptive)", required: true, mode: "structural-only" },
  // theme_maps
  { table: "theme_maps", field: "family", label: "Theme family", required: true, softenPunctuation: true },
  // ao5_tensions
  { table: "ao5_tensions", field: "level_tag", label: "Level tag", required: true, softenPunctuation: true },
  // theses (secondary)
  { table: "theses", field: "theme_family", label: "Theme family", required: true, softenPunctuation: true },
  { table: "theses", field: "level", label: "Level", required: true, softenPunctuation: true },
  { table: "theses", field: "route_id", label: "Route", required: true, routeLookup: true },
  // paragraph_jobs
  { table: "paragraph_jobs", field: "question_family", label: "Question family", required: true, softenPunctuation: true },
  { table: "paragraph_jobs", field: "route_id", label: "Route", required: true, routeLookup: true },
  // character_cards
  { table: "character_cards", field: "source_text", label: "Source text", required: true },
  // symbol_entries
  { table: "symbol_entries", field: "source_text", label: "Source text", required: true },
];

// ---------------------------------------------------------------------------
// Normalization (comparison only — never mutates stored values).
// ---------------------------------------------------------------------------

/** Trim + collapse internal whitespace + lowercase. */
export function normalizeBasic(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/** As normalizeBasic, but also strips punctuation/separators for similarity. */
export function normalizeSoft(s: string): string {
  return normalizeBasic(s).replace(/[._\-/\\:;,.()'"`]+/g, "");
}

const PLACEHOLDER_VALUES = new Set([
  "test",
  "tbc",
  "tbd",
  "todo",
  "n/a",
  "na",
  "none",
  "misc",
  "other",
  "placeholder",
  "sample",
  "draft",
  "xxx",
  "lorem",
  "-",
  "—",
]);

function looksLikePlaceholder(s: string): boolean {
  return PLACEHOLDER_VALUES.has(normalizeBasic(s));
}

// ---------------------------------------------------------------------------
// Levenshtein (small, no deps).
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // O(min(m,n)) memory single-row DP.
  if (m > n) return levenshtein(b, a);
  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;
  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    const bj = b.charCodeAt(j - 1);
    for (let i = 1; i <= m; i++) {
      const cost = a.charCodeAt(i - 1) === bj ? 0 : 1;
      curr[i] = Math.min(
        curr[i - 1] + 1,
        prev[i] + 1,
        prev[i - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

// ---------------------------------------------------------------------------
// Findings & severity.
// ---------------------------------------------------------------------------

export type Severity = "high" | "medium" | "low";

export type IssueType =
  | "case_drift"
  | "whitespace_drift"
  | "punctuation_drift"
  | "near_duplicate"
  | "low_frequency"
  | "unknown_route"
  | "placeholder"
  | "empty_required";

export interface VocabularyFinding {
  id: string;
  table: AuditableTable;
  field: string;
  fieldLabel: string;
  storedValue: string;
  normalizedValue: string;
  /** Most common value in the same normalized group (or canonical guess). */
  canonicalCandidate: string | null;
  /** Frequency of this exact stored value across the field. */
  frequency: number;
  /** Frequency of the most common value in this field. */
  fieldDominantFrequency: number;
  /** Total non-empty values in this field. */
  fieldTotal: number;
  /** Sibling stored values that share the normalized group, ordered by freq. */
  relatedValues: Array<{ value: string; frequency: number }>;
  issueType: IssueType;
  severity: Severity;
  reason: string;
  suggestedReview: string;
  /** Up to 5 example record IDs using this stored value. */
  exampleRecordIds: string[];
  /** Resolved route name (only set when routeLookup applies and id is known). */
  routeName?: string | null;
}

// ---------------------------------------------------------------------------
// Loader — pulls field values for every audited (table, field) plus routes.
// ---------------------------------------------------------------------------

interface RawRow {
  id: string;
  /** For scalar fields: the stored value (or null). For array fields: one
   *  exploded element (a single row per element). When the array is empty
   *  for a record, a single row with value=null is emitted so emptiness
   *  can still be flagged. */
  value: string | null;
}

async function loadFieldValues(spec: AuditField): Promise<RawRow[]> {
  const { table, field, mode } = spec;
  const { data, error } = await supabase
    .from(table as never)
    .select(`id, ${field}`)
    .limit(1000);
  if (error || !data) return [];
  const rows = data as Array<Record<string, unknown>>;

  if (mode === "array-tag") {
    const out: RawRow[] = [];
    rows.forEach((r) => {
      const id = String(r.id ?? "");
      const raw = r[field];
      if (Array.isArray(raw) && raw.length > 0) {
        raw.forEach((el) => {
          out.push({
            id,
            value: typeof el === "string" ? el : el == null ? null : String(el),
          });
        });
      } else {
        // Empty / null array — emit a single null row so empty_required can fire.
        out.push({ id, value: null });
      }
    });
    return out;
  }

  return rows.map((r) => {
    const raw = r[field];
    return {
      id: String(r.id ?? ""),
      value: typeof raw === "string" ? raw : raw == null ? null : String(raw),
    };
  });
}

async function loadRoutes(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("routes")
    .select("id, name");
  const map = new Map<string, string>();
  if (error || !data) return map;
  (data as Array<{ id: string; name: string | null }>).forEach((r) => {
    if (typeof r.id === "string") map.set(r.id, r.name ?? r.id);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Per-field analysis — produces findings for ONE (table, field).
// ---------------------------------------------------------------------------

interface FieldAnalysis {
  uniqueStoredValues: number;
  totalNonEmpty: number;
  findings: VocabularyFinding[];
}

function analyzeField(
  spec: AuditField,
  rows: RawRow[],
  routes: Map<string, string> | null,
): FieldAnalysis {
  const mode: AuditMode = spec.mode ?? "standard";
  const isStructuralOnly = mode === "structural-only";
  const isArrayTag = mode === "array-tag";

  // Group: stored value -> { ids[] }
  const byStored = new Map<string, string[]>();
  let totalNonEmpty = 0;
  const emptyIds: string[] = [];

  rows.forEach((r) => {
    const raw = r.value ?? "";
    if (raw.trim() === "") {
      if (spec.required) emptyIds.push(r.id);
      return;
    }
    totalNonEmpty++;
    const list = byStored.get(raw) ?? [];
    list.push(r.id);
    byStored.set(raw, list);
  });

  // Frequency table.
  const freq: Array<{ value: string; ids: string[] }> = Array.from(byStored.entries())
    .map(([value, ids]) => ({ value, ids }))
    .sort((a, b) => b.ids.length - a.ids.length);

  const dominantFrequency = freq[0]?.ids.length ?? 0;

  // Group by normalized form to detect case/whitespace/punctuation drift.
  type GroupEntry = { value: string; ids: string[] };
  const byNorm = new Map<string, GroupEntry[]>();
  freq.forEach((entry) => {
    const norm = normalizeBasic(entry.value);
    const arr = byNorm.get(norm) ?? [];
    arr.push(entry);
    byNorm.set(norm, arr);
  });

  // For punctuation drift / near-duplicate, group by softened normalization.
  const bySoft = new Map<string, GroupEntry[]>();
  freq.forEach((entry) => {
    const soft = normalizeSoft(entry.value);
    if (!soft) return;
    const arr = bySoft.get(soft) ?? [];
    arr.push(entry);
    bySoft.set(soft, arr);
  });

  const findings: VocabularyFinding[] = [];

  const pushFinding = (f: Omit<VocabularyFinding, "id" | "fieldLabel" | "fieldTotal" | "fieldDominantFrequency" | "table" | "field">) => {
    findings.push({
      id: `${spec.table}:${spec.field}:${f.issueType}:${f.storedValue}`,
      table: spec.table,
      field: spec.field,
      fieldLabel: spec.label,
      fieldTotal: totalNonEmpty,
      fieldDominantFrequency: dominantFrequency,
      ...f,
    });
  };

  // 1. Empty required.
  if (spec.required && emptyIds.length > 0) {
    pushFinding({
      storedValue: "",
      normalizedValue: "",
      canonicalCandidate: freq[0]?.value ?? null,
      frequency: emptyIds.length,
      relatedValues: [],
      issueType: "empty_required",
      severity: "high",
      reason: `${emptyIds.length} record${emptyIds.length === 1 ? "" : "s"} have an empty value in this required classification field.`,
      suggestedReview: "Open the records and assign a controlled value, or relax the field requirement if appropriate.",
      exampleRecordIds: emptyIds.slice(0, 5),
    });
  }

  // 2. Unknown route references (only when routeLookup applies).
  if (spec.routeLookup && routes) {
    freq.forEach((entry) => {
      if (!routes.has(entry.value)) {
        pushFinding({
          storedValue: entry.value,
          normalizedValue: normalizeBasic(entry.value),
          canonicalCandidate: null,
          frequency: entry.ids.length,
          relatedValues: [],
          issueType: "unknown_route",
          severity: "high",
          reason: `Route id "${entry.value}" does not resolve against the routes table.`,
          suggestedReview: "Check whether the route was renamed, deleted, or mistyped, then update the affected records.",
          exampleRecordIds: entry.ids.slice(0, 5),
          routeName: null,
        });
      }
    });
  }

  // 3. Case / whitespace drift — same normalized form, different stored forms.
  byNorm.forEach((entries) => {
    if (entries.length < 2) return;
    // Most frequent stored form is the canonical candidate.
    const sorted = [...entries].sort((a, b) => b.ids.length - a.ids.length);
    const canonical = sorted[0].value;
    sorted.slice(1).forEach((entry) => {
      const isWhitespace = entry.value.trim() !== entry.value || /\s{2,}/.test(entry.value);
      const issueType: IssueType = isWhitespace && entry.value.trim().toLowerCase() === canonical.trim().toLowerCase()
        ? "whitespace_drift"
        : "case_drift";
      // Structural-only fields: skip pure case-drift findings (descriptive
      // prose where casing variation is expected). Keep whitespace drift.
      if (isStructuralOnly && issueType === "case_drift") return;
      pushFinding({
        storedValue: entry.value,
        normalizedValue: normalizeBasic(entry.value),
        canonicalCandidate: canonical,
        frequency: entry.ids.length,
        relatedValues: sorted.map((e) => ({ value: e.value, frequency: e.ids.length })),
        issueType,
        severity: "medium",
        reason: issueType === "whitespace_drift"
          ? `Differs from "${canonical}" only by whitespace.`
          : `Differs from "${canonical}" only by letter case.`,
        suggestedReview: `Re-save the affected records with the canonical form "${canonical}".`,
        exampleRecordIds: entry.ids.slice(0, 5),
      });
    });
  });

  // 4. Punctuation drift — same softened form, different basic-normalized forms.
  if (!isStructuralOnly && (spec.softenPunctuation || spec.routeLookup === undefined)) {
    bySoft.forEach((entries) => {
      if (entries.length < 2) return;
      const distinctNorm = new Set(entries.map((e) => normalizeBasic(e.value)));
      if (distinctNorm.size < 2) return; // already covered by case/ws drift
      const sorted = [...entries].sort((a, b) => b.ids.length - a.ids.length);
      const canonical = sorted[0].value;
      sorted.slice(1).forEach((entry) => {
        if (normalizeBasic(entry.value) === normalizeBasic(canonical)) return;
        // Avoid duplicating findings already raised by case/ws drift.
        if (findings.some((f) => f.storedValue === entry.value && (f.issueType === "case_drift" || f.issueType === "whitespace_drift"))) {
          return;
        }
        pushFinding({
          storedValue: entry.value,
          normalizedValue: normalizeBasic(entry.value),
          canonicalCandidate: canonical,
          frequency: entry.ids.length,
          relatedValues: sorted.map((e) => ({ value: e.value, frequency: e.ids.length })),
          issueType: "punctuation_drift",
          severity: "medium",
          reason: `Punctuation/format differs from "${canonical}" but values are otherwise identical.`,
          suggestedReview: `Decide on a canonical punctuation form; re-save affected records to match.`,
          exampleRecordIds: entry.ids.slice(0, 5),
        });
      });
    });
  }

  // 5. Near-duplicate (Levenshtein ≤ 2 on values ≥ 5 chars).
  for (let i = 0; i < freq.length; i++) {
    const a = freq[i];
    if (a.value.length < 5) continue;
    for (let j = i + 1; j < freq.length; j++) {
      const b = freq[j];
      if (b.value.length < 5) continue;
      const na = normalizeBasic(a.value);
      const nb = normalizeBasic(b.value);
      if (na === nb) continue;
      // Skip if already grouped by softened normalization (handled above).
      if (normalizeSoft(a.value) === normalizeSoft(b.value)) continue;
      const d = levenshtein(na, nb);
      if (d > 0 && d <= 2) {
        // Flag the LESS common value as the suspect.
        const suspect = a.ids.length <= b.ids.length ? a : b;
        const canonical = suspect === a ? b : a;
        if (findings.some((f) => f.storedValue === suspect.value && f.issueType === "near_duplicate")) {
          continue;
        }
        pushFinding({
          storedValue: suspect.value,
          normalizedValue: normalizeBasic(suspect.value),
          canonicalCandidate: canonical.value,
          frequency: suspect.ids.length,
          relatedValues: [
            { value: canonical.value, frequency: canonical.ids.length },
            { value: suspect.value, frequency: suspect.ids.length },
          ],
          issueType: "near_duplicate",
          severity: suspect.ids.length === 1 ? "high" : "medium",
          reason: `Looks similar to "${canonical.value}" (edit distance ${d}). Possible typo.`,
          suggestedReview: `Confirm whether "${suspect.value}" is intentional or should be merged with "${canonical.value}".`,
          exampleRecordIds: suspect.ids.slice(0, 5),
        });
      }
    }
  }

  // 6. Placeholder / weak value.
  freq.forEach((entry) => {
    if (looksLikePlaceholder(entry.value)) {
      pushFinding({
        storedValue: entry.value,
        normalizedValue: normalizeBasic(entry.value),
        canonicalCandidate: freq[0].value !== entry.value ? freq[0].value : null,
        frequency: entry.ids.length,
        relatedValues: [],
        issueType: "placeholder",
        severity: spec.required ? "high" : "medium",
        reason: `Value "${entry.value}" looks like a placeholder.`,
        suggestedReview: "Replace with a real classification value.",
        exampleRecordIds: entry.ids.slice(0, 5),
      });
    }
  });

  // 7. Low-frequency outliers.
  // count ≤ 2 OR < 10% of dominant frequency, only when there's a clear majority.
  if (dominantFrequency >= 3) {
    const threshold = Math.max(2, Math.floor(dominantFrequency * 0.1));
    freq.forEach((entry) => {
      if (entry.value === freq[0].value) return;
      const isLow = entry.ids.length <= 2 || entry.ids.length < threshold;
      if (!isLow) return;
      // Skip if any other finding already covers this stored value.
      if (findings.some((f) => f.storedValue === entry.value)) return;
      pushFinding({
        storedValue: entry.value,
        normalizedValue: normalizeBasic(entry.value),
        canonicalCandidate: freq[0].value,
        frequency: entry.ids.length,
        relatedValues: freq.slice(0, 5).map((e) => ({ value: e.value, frequency: e.ids.length })),
        issueType: "low_frequency",
        severity: "low",
        reason: `Used in only ${entry.ids.length} record${entry.ids.length === 1 ? "" : "s"} vs ${dominantFrequency} for "${freq[0].value}".`,
        suggestedReview: "Confirm this is a legitimate distinct value, or migrate to the dominant form.",
        exampleRecordIds: entry.ids.slice(0, 5),
      });
    });
  }

  return {
    uniqueStoredValues: byStored.size,
    totalNonEmpty,
    findings,
  };
}

// ---------------------------------------------------------------------------
// Public entrypoint — runs the full audit.
// ---------------------------------------------------------------------------

export interface VocabularyAuditResult {
  generatedAt: Date;
  fieldsAudited: number;
  uniqueValuesReviewed: number;
  findings: VocabularyFinding[];
}

export async function runVocabularyAudit(): Promise<VocabularyAuditResult> {
  const needsRoutes = AUDITABLE_FIELDS.some((f) => f.routeLookup);
  const [routes, rowsByKey] = await Promise.all([
    needsRoutes ? loadRoutes() : Promise.resolve(null),
    Promise.all(
      AUDITABLE_FIELDS.map(async (spec) => ({
        spec,
        rows: await loadFieldValues(spec),
      })),
    ),
  ]);

  let uniqueValues = 0;
  const findings: VocabularyFinding[] = [];

  rowsByKey.forEach(({ spec, rows }) => {
    const result = analyzeField(spec, rows, routes);
    uniqueValues += result.uniqueStoredValues;
    // Attach route names to unknown_route findings (already null) and resolved
    // route names to other findings on route fields for richer detail.
    if (spec.routeLookup && routes) {
      result.findings.forEach((f) => {
        if (f.issueType !== "unknown_route") {
          f.routeName = routes.get(f.storedValue) ?? null;
        }
      });
    }
    findings.push(...result.findings);
  });

  // Deterministic order: severity → table → field → issueType → value
  const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => {
    if (a.severity !== b.severity) return severityRank[a.severity] - severityRank[b.severity];
    if (a.table !== b.table) return a.table.localeCompare(b.table);
    if (a.field !== b.field) return a.field.localeCompare(b.field);
    if (a.issueType !== b.issueType) return a.issueType.localeCompare(b.issueType);
    return a.storedValue.localeCompare(b.storedValue);
  });

  return {
    generatedAt: new Date(),
    fieldsAudited: AUDITABLE_FIELDS.length,
    uniqueValuesReviewed: uniqueValues,
    findings,
  };
}

// ---------------------------------------------------------------------------
// CSV export.
// ---------------------------------------------------------------------------

export function findingsToCsv(findings: VocabularyFinding[]): string {
  const head = [
    "table",
    "field",
    "stored_value",
    "normalized_value",
    "canonical_candidate",
    "frequency",
    "field_total",
    "issue_type",
    "severity",
    "reason",
    "suggested_review",
    "example_record_ids",
  ];
  const escape = (s: string) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [head.join(",")];
  findings.forEach((f) => {
    lines.push(
      [
        f.table,
        f.field,
        escape(f.storedValue),
        escape(f.normalizedValue),
        escape(f.canonicalCandidate ?? ""),
        String(f.frequency),
        String(f.fieldTotal),
        f.issueType,
        f.severity,
        escape(f.reason),
        escape(f.suggestedReview),
        escape(f.exampleRecordIds.join(";")),
      ].join(","),
    );
  });
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Display labels.
// ---------------------------------------------------------------------------

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  case_drift: "Case drift",
  whitespace_drift: "Whitespace drift",
  punctuation_drift: "Punctuation drift",
  near_duplicate: "Near-duplicate",
  low_frequency: "Low frequency",
  unknown_route: "Unknown route",
  placeholder: "Placeholder",
  empty_required: "Empty (required)",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
