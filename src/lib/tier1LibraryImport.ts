export type Tier1LibraryTarget =
  | "library_quotes"
  | "library_questions"
  | "library_comparative_pairings"
  | "library_thesis_bank"
  | "library_paragraph_frames"
  | "library_context_bank";

export type ValidationStatus = "valid" | "warning" | "invalid";

export interface Tier1LibraryTargetConfig {
  tableName: Tier1LibraryTarget;
  label: string;
  requiredFields: string[];
  allowedFields: string[];
  arrayFields: string[];
  objectFields: string[];
  numberFields: string[];
  primaryContentFields: string[];
  headerAliases: Record<string, string>;
  warningFields: string[];
  hashFields: string[];
}

export interface Tier1NormalizeOptions {
  sourceDataset?: string;
  sourceSheet?: string;
  sourceRowNumber?: number;
}

export interface Tier1PrepareOptions extends Tier1NormalizeOptions {
  firstDataRowNumber?: number;
}

export interface Tier1ValidationIssue {
  field?: string;
  message: string;
}

export interface PreparedTier1LibraryRow {
  sourceRowNumber: number;
  sourcePayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  contentHash: string;
  dedupeKey: string;
  validationStatus: Exclude<ValidationStatus, "invalid">;
  validationErrors: Tier1ValidationIssue[];
  validationWarnings: Tier1ValidationIssue[];
}

export interface InvalidTier1LibraryRow {
  sourceRowNumber: number;
  sourcePayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  contentHash?: string;
  dedupeKey?: string;
  validationStatus: "invalid";
  validationErrors: Tier1ValidationIssue[];
  validationWarnings: Tier1ValidationIssue[];
}

export interface Tier1PrepareReport {
  rows_total: number;
  rows_valid: number;
  rows_warning: number;
  rows_invalid: number;
  preparedRows: PreparedTier1LibraryRow[];
  invalidRows: InvalidTier1LibraryRow[];
  warnings: Array<Tier1ValidationIssue & { row: number }>;
  errors: Array<Tier1ValidationIssue & { row: number }>;
}

export interface Tier1ImportParams {
  supabase?: SupabaseLikeClient;
  targetTable: string;
  rows: Record<string, unknown>[];
  sourceDataset?: string;
  sourceSheet?: string;
  sourceUrl?: string;
  sourceSheetId?: string;
  createLog?: boolean;
  importedBy?: string | null;
}

export interface Tier1StageImportParams extends Omit<Tier1ImportParams, "createLog"> {
  supabase: SupabaseLikeClient;
}

export interface Tier1ImportReport extends Tier1PrepareReport {
  importLogId?: string;
  stagedCount: number;
  stageErrors: Tier1ValidationIssue[];
}

type SupabaseResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type SupabaseInsertLike = {
  select?: (columns?: string) => {
    single?: () => Promise<SupabaseResult<Record<string, unknown>>>;
  };
} & PromiseLike<SupabaseResult>;

export interface SupabaseLikeClient {
  from: (...args: unknown[]) => {
    insert: (payload: unknown) => unknown;
    update?: (payload: unknown) => {
      eq: (column: string, value: unknown) => unknown;
    };
  };
}

interface NormalizeInternalResult {
  row: Record<string, unknown>;
  issues: Tier1ValidationIssue[];
}

const SHARED_SOURCE_FIELDS = [
  "metadata",
  "content_hash",
  "source_dataset",
  "source_sheet",
  "source_row_number",
  "import_log_id",
];

const ARRAY_FIELDS = [
  "theme_tags",
  "motif_tags",
  "method_tags",
  "context_tags",
  "ao_tags",
  "method_links",
  "context_links",
  "linked_quote_refs",
];

const alias = (entries: Array<[string[], string]>) => {
  const out: Record<string, string> = {};
  for (const [headers, field] of entries) {
    for (const header of headers) out[canonicalHeader(header)] = field;
  }
  return out;
};

export const TIER1_LIBRARY_TARGETS: Record<Tier1LibraryTarget, Tier1LibraryTargetConfig> = {
  library_quotes: {
    tableName: "library_quotes",
    label: "Library Quotes",
    requiredFields: ["quote_text", "source_text"],
    allowedFields: [
      "quote_text",
      "source_text",
      "author",
      "character_name",
      "speaker",
      "chapter",
      "part",
      "location_ref",
      "theme_tags",
      "motif_tags",
      "method_tags",
      "context_tags",
      "ao_tags",
      "difficulty_level",
      "exam_relevance",
      "analysis",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "motif_tags", "method_tags", "context_tags", "ao_tags"],
    objectFields: ["metadata"],
    numberFields: ["source_row_number"],
    primaryContentFields: ["quote_text"],
    headerAliases: alias([
      [["quote", "quotation", "text", "quote_text"], "quote_text"],
      [["source", "source text", "source_text", "text_name", "novel", "book"], "source_text"],
      [["author"], "author"],
      [["character", "character_name"], "character_name"],
      [["speaker"], "speaker"],
      [["chapter"], "chapter"],
      [["part"], "part"],
      [["location", "location_ref", "reference"], "location_ref"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["motif", "motifs", "motif_tags"], "motif_tags"],
      [["method", "methods", "method_tags", "technique", "techniques"], "method_tags"],
      [["context", "contexts", "context_tags"], "context_tags"],
      [["ao", "aos", "ao_tags", "assessment_objectives"], "ao_tags"],
      [["difficulty", "difficulty_level"], "difficulty_level"],
      [["exam relevance", "exam_relevance", "exam_use"], "exam_relevance"],
      [["analysis"], "analysis"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "difficulty_level", "notes", "analysis"],
    hashFields: ["quote_text", "source_text", "character_name", "speaker", "location_ref"],
  },
  library_questions: {
    tableName: "library_questions",
    label: "Library Questions",
    requiredFields: ["question_text"],
    allowedFields: [
      "question_text",
      "component",
      "paper",
      "section",
      "source_text",
      "paired_text",
      "theme_tags",
      "method_tags",
      "context_tags",
      "ao_tags",
      "mark_value",
      "difficulty_level",
      "exam_series",
      "question_type",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "method_tags", "context_tags", "ao_tags"],
    objectFields: ["metadata"],
    numberFields: ["mark_value", "source_row_number"],
    primaryContentFields: ["question_text"],
    headerAliases: alias([
      [["question", "exam question", "exam_question", "question_text"], "question_text"],
      [["component"], "component"],
      [["paper"], "paper"],
      [["section"], "section"],
      [["source", "source_text", "text", "novel", "book"], "source_text"],
      [["paired_text", "paired text", "comparison text", "text_b"], "paired_text"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["method", "methods", "method_tags"], "method_tags"],
      [["context", "contexts", "context_tags"], "context_tags"],
      [["ao", "aos", "ao_tags", "ao_focus"], "ao_tags"],
      [["marks", "mark", "mark_value"], "mark_value"],
      [["difficulty", "difficulty_level"], "difficulty_level"],
      [["exam_series", "series", "year"], "exam_series"],
      [["question_type", "type"], "question_type"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "source_text", "difficulty_level", "notes"],
    hashFields: ["question_text", "component", "paper", "exam_series"],
  },
  library_comparative_pairings: {
    tableName: "library_comparative_pairings",
    label: "Library Comparative Pairings",
    requiredFields: ["text_a", "text_b", "comparison_focus"],
    allowedFields: [
      "pairing_title",
      "source_text",
      "text_a",
      "text_b",
      "quote_a",
      "quote_b",
      "comparison_focus",
      "theme_tags",
      "method_links",
      "context_links",
      "ao_tags",
      "argument_summary",
      "exam_use",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "method_links", "context_links", "ao_tags"],
    objectFields: ["metadata"],
    numberFields: ["source_row_number"],
    primaryContentFields: ["text_a", "text_b", "comparison_focus"],
    headerAliases: alias([
      [["title", "pairing_title"], "pairing_title"],
      [["source", "source_text"], "source_text"],
      [["text_a", "text a", "first text"], "text_a"],
      [["text_b", "text b", "second text"], "text_b"],
      [["quote_a", "quote a", "first quote"], "quote_a"],
      [["quote_b", "quote b", "second quote"], "quote_b"],
      [["comparison_focus", "comparison focus", "focus"], "comparison_focus"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["method_links", "method links", "method", "methods"], "method_links"],
      [["context_links", "context links", "context", "contexts"], "context_links"],
      [["ao", "aos", "ao_tags"], "ao_tags"],
      [["argument", "argument_summary"], "argument_summary"],
      [["exam_use", "exam use"], "exam_use"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "source_text", "notes"],
    hashFields: ["text_a", "text_b", "comparison_focus", "quote_a", "quote_b"],
  },
  library_thesis_bank: {
    tableName: "library_thesis_bank",
    label: "Library Thesis Bank",
    requiredFields: ["thesis_text"],
    allowedFields: [
      "thesis_text",
      "question_focus",
      "source_text",
      "paired_text",
      "theme_tags",
      "ao_tags",
      "grade_band",
      "argument_type",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "ao_tags"],
    objectFields: ["metadata"],
    numberFields: ["source_row_number"],
    primaryContentFields: ["thesis_text"],
    headerAliases: alias([
      [["thesis", "thesis_text", "argument"], "thesis_text"],
      [["question_focus", "question focus", "focus"], "question_focus"],
      [["source", "source_text", "text", "novel", "book"], "source_text"],
      [["paired_text", "paired text", "comparison text", "text_b"], "paired_text"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["ao", "aos", "ao_tags", "ao_focus"], "ao_tags"],
      [["grade_band", "grade band", "grade"], "grade_band"],
      [["argument_type", "argument type", "type"], "argument_type"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "source_text", "grade_band", "notes"],
    hashFields: ["thesis_text", "question_focus", "source_text", "paired_text"],
  },
  library_paragraph_frames: {
    tableName: "library_paragraph_frames",
    label: "Library Paragraph Frames",
    requiredFields: ["frame_text"],
    allowedFields: [
      "frame_title",
      "source_text",
      "frame_text",
      "opening_stem",
      "comparison_stem",
      "ao2_stem",
      "ao3_stem",
      "ao4_stem",
      "ao5_stem",
      "theme_tags",
      "ao_tags",
      "grade_band",
      "use_case",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "ao_tags"],
    objectFields: ["metadata"],
    numberFields: ["source_row_number"],
    primaryContentFields: ["frame_text"],
    headerAliases: alias([
      [["title", "frame_title"], "frame_title"],
      [["source", "source_text"], "source_text"],
      [["frame", "paragraph_frame", "paragraph frame", "frame_text"], "frame_text"],
      [["opening_stem", "opening stem"], "opening_stem"],
      [["comparison_stem", "comparison stem"], "comparison_stem"],
      [["ao2_stem", "ao2 stem"], "ao2_stem"],
      [["ao3_stem", "ao3 stem"], "ao3_stem"],
      [["ao4_stem", "ao4 stem"], "ao4_stem"],
      [["ao5_stem", "ao5 stem"], "ao5_stem"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["ao", "aos", "ao_tags"], "ao_tags"],
      [["grade_band", "grade band", "grade"], "grade_band"],
      [["use_case", "use case"], "use_case"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "source_text", "grade_band", "notes"],
    hashFields: ["frame_text", "grade_band", "use_case"],
  },
  library_context_bank: {
    tableName: "library_context_bank",
    label: "Library Context Bank",
    requiredFields: ["context_point"],
    allowedFields: [
      "context_title",
      "context_point",
      "source_text",
      "context_type",
      "theme_tags",
      "ao_tags",
      "linked_quote_refs",
      "exam_use",
      "notes",
      ...SHARED_SOURCE_FIELDS,
    ],
    arrayFields: ["theme_tags", "ao_tags", "linked_quote_refs"],
    objectFields: ["metadata"],
    numberFields: ["source_row_number"],
    primaryContentFields: ["context_point"],
    headerAliases: alias([
      [["title", "context_title"], "context_title"],
      [["context", "context_point", "context point", "point"], "context_point"],
      [["source", "source_text", "text", "novel", "book"], "source_text"],
      [["context_type", "context type", "type"], "context_type"],
      [["theme", "themes", "theme_tags"], "theme_tags"],
      [["ao", "aos", "ao_tags", "ao3_link"], "ao_tags"],
      [["linked_quote_refs", "linked quote refs", "quote_refs", "quote references"], "linked_quote_refs"],
      [["exam_use", "exam use"], "exam_use"],
      [["notes"], "notes"],
    ]),
    warningFields: ["theme_tags", "ao_tags", "source_text", "notes"],
    hashFields: ["context_point", "source_text", "context_type"],
  },
};

export function getTier1LibraryTargets(): Tier1LibraryTargetConfig[] {
  return Object.values(TIER1_LIBRARY_TARGETS);
}

export function isTier1LibraryTarget(targetTable: string): targetTable is Tier1LibraryTarget {
  return Object.prototype.hasOwnProperty.call(TIER1_LIBRARY_TARGETS, targetTable);
}

export function normalizeTier1LibraryRow(
  targetTable: string,
  rawRow: Record<string, unknown>,
  options: Tier1NormalizeOptions = {},
): Record<string, unknown> {
  return normalizeTier1LibraryRowInternal(targetTable, rawRow, options).row;
}

export function validateTier1LibraryRow(
  targetTable: string,
  normalizedRow: Record<string, unknown>,
): { status: ValidationStatus; errors: Tier1ValidationIssue[]; warnings: Tier1ValidationIssue[] } {
  if (!isTier1LibraryTarget(targetTable)) {
    return {
      status: "invalid",
      errors: [{ message: `Unknown target table: ${targetTable}` }],
      warnings: [],
    };
  }

  const config = TIER1_LIBRARY_TARGETS[targetTable];
  const errors: Tier1ValidationIssue[] = [];
  const warnings: Tier1ValidationIssue[] = [];

  for (const field of Object.keys(normalizedRow)) {
    if (!config.allowedFields.includes(field)) {
      errors.push({ field, message: `Field is not allowed for ${targetTable}` });
    }
  }

  for (const field of config.requiredFields) {
    if (isBlank(normalizedRow[field])) {
      errors.push({ field, message: `Missing required field: ${field}` });
    }
  }

  for (const field of config.primaryContentFields) {
    if (isBlank(normalizedRow[field])) {
      errors.push({ field, message: `Empty primary content field: ${field}` });
    }
  }

  for (const field of config.arrayFields) {
    const value = normalizedRow[field];
    if (value != null && !Array.isArray(value)) {
      errors.push({ field, message: `Array field is not normalisable to an array: ${field}` });
    }
  }

  for (const field of config.objectFields) {
    const value = normalizedRow[field];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push({ field, message: `Invalid metadata object: ${field}` });
    }
  }

  for (const field of config.numberFields) {
    const value = normalizedRow[field];
    if (value != null && (typeof value !== "number" || !Number.isFinite(value))) {
      errors.push({ field, message: `Invalid number field: ${field}` });
    }
  }

  for (const field of config.warningFields) {
    if (isBlank(normalizedRow[field]) || (Array.isArray(normalizedRow[field]) && normalizedRow[field].length === 0)) {
      warnings.push({ field, message: `Missing recommended field: ${field}` });
    }
  }

  return {
    status: errors.length > 0 ? "invalid" : warnings.length > 0 ? "warning" : "valid",
    errors,
    warnings,
  };
}

export function prepareTier1LibraryRows(
  targetTable: string,
  rows: Record<string, unknown>[],
  options: Tier1PrepareOptions = {},
): Tier1PrepareReport {
  if (!isTier1LibraryTarget(targetTable)) {
    return {
      rows_total: rows.length,
      rows_valid: 0,
      rows_warning: 0,
      rows_invalid: rows.length,
      preparedRows: [],
      invalidRows: rows.map((row, index) => ({
        sourceRowNumber: rowNumberFor(index, row, options),
        sourcePayload: row,
        normalizedPayload: {},
        validationStatus: "invalid",
        validationErrors: [{ message: `Unknown target table: ${targetTable}` }],
        validationWarnings: [],
      })),
      warnings: [],
      errors: rows.map((row, index) => ({
        row: rowNumberFor(index, row, options),
        message: `Unknown target table: ${targetTable}`,
      })),
    };
  }

  const preparedRows: PreparedTier1LibraryRow[] = [];
  const invalidRows: InvalidTier1LibraryRow[] = [];
  const warnings: Array<Tier1ValidationIssue & { row: number }> = [];
  const errors: Array<Tier1ValidationIssue & { row: number }> = [];

  rows.forEach((rawRow, index) => {
    const sourceRowNumber = rowNumberFor(index, rawRow, options);
    const normalizedResult = normalizeTier1LibraryRowInternal(targetTable, rawRow, {
      ...options,
      sourceRowNumber,
    });
    const validation = validateTier1LibraryRow(targetTable, normalizedResult.row);
    const validationErrors = [...normalizedResult.issues, ...validation.errors];
    const validationWarnings = validation.warnings;
    const status: ValidationStatus = validationErrors.length > 0
      ? "invalid"
      : validationWarnings.length > 0
      ? "warning"
      : "valid";

    const contentHash = status === "invalid"
      ? safeGenerateContentHash(targetTable, normalizedResult.row)
      : generateContentHash(targetTable, normalizedResult.row);
    const dedupeKey = contentHash ? `${targetTable}:${contentHash}` : "";

    for (const issue of validationErrors) errors.push({ row: sourceRowNumber, ...issue });
    for (const issue of validationWarnings) warnings.push({ row: sourceRowNumber, ...issue });

    if (status === "invalid") {
      invalidRows.push({
        sourceRowNumber,
        sourcePayload: rawRow,
        normalizedPayload: normalizedResult.row,
        contentHash: contentHash || undefined,
        dedupeKey: dedupeKey || undefined,
        validationStatus: "invalid",
        validationErrors,
        validationWarnings,
      });
      return;
    }

    preparedRows.push({
      sourceRowNumber,
      sourcePayload: rawRow,
      normalizedPayload: {
        ...normalizedResult.row,
        content_hash: contentHash,
      },
      contentHash,
      dedupeKey,
      validationStatus: status,
      validationErrors: [],
      validationWarnings,
    });
  });

  return {
    rows_total: rows.length,
    rows_valid: preparedRows.filter((row) => row.validationStatus === "valid").length,
    rows_warning: preparedRows.filter((row) => row.validationStatus === "warning").length,
    rows_invalid: invalidRows.length,
    preparedRows,
    invalidRows,
    warnings,
    errors,
  };
}

export async function dryRunTier1LibraryImport(params: Tier1ImportParams): Promise<Tier1ImportReport> {
  const report = prepareTier1LibraryRows(params.targetTable, params.rows, {
    sourceDataset: params.sourceDataset,
    sourceSheet: params.sourceSheet,
    firstDataRowNumber: 2,
  });

  let importLogId: string | undefined;
  const shouldCreateLog = params.createLog === true && params.supabase;
  if (shouldCreateLog) {
    const logResult = await createImportLog(params.supabase, params, report, 0);
    if (logResult.error) {
      return { ...report, stagedCount: 0, stageErrors: [{ message: logResult.error }] };
    }
    importLogId = logResult.id;
  }

  return { ...report, importLogId, stagedCount: 0, stageErrors: [] };
}

export async function stageTier1LibraryImport(params: Tier1StageImportParams): Promise<Tier1ImportReport> {
  const report = prepareTier1LibraryRows(params.targetTable, params.rows, {
    sourceDataset: params.sourceDataset,
    sourceSheet: params.sourceSheet,
    firstDataRowNumber: 2,
  });

  const logResult = await createImportLog(params.supabase, params, report, report.preparedRows.length);
  if (logResult.error || !logResult.id) {
    return {
      ...report,
      stagedCount: 0,
      stageErrors: [{ message: logResult.error || "Failed to create import log" }],
    };
  }

  if (report.preparedRows.length === 0) {
    return { ...report, importLogId: logResult.id, stagedCount: 0, stageErrors: [] };
  }

  const stagedPayload = report.preparedRows.map((row) => {
    const metadata = normalizeMetadata(row.normalizedPayload.metadata);
    const sourceMetadata = {
      ...metadata,
      ...(params.sourceUrl ? { source_url: params.sourceUrl } : {}),
      ...(params.sourceSheetId ? { source_sheet_id: params.sourceSheetId } : {}),
    };
    const enrichedPayload = {
      ...row.normalizedPayload,
      metadata: sourceMetadata,
      import_log_id: logResult.id,
    };

    return {
      proposal_type: "edit",
      target_table: params.targetTable,
      target_record_id: row.dedupeKey,
      changed_fields: Object.keys(enrichedPayload),
      original_snapshot: {},
      proposed_patch: enrichedPayload,
      operation: "upsert",
      source_payload: row.sourcePayload,
      normalized_payload: enrichedPayload,
      validation_status: row.validationStatus,
      validation_errors: [...row.validationErrors, ...row.validationWarnings],
      status: "pending",
      source_surface: "tier1_library_import",
      source_finding_id: params.sourceSheetId || params.sourceUrl || null,
      source_issue_type: row.validationStatus === "warning" ? "validation_warning" : "validated",
      note: importNote(params),
      source_row_number: row.sourceRowNumber,
      import_log_id: logResult.id,
      content_hash: row.contentHash,
      dedupe_key: row.dedupeKey,
    };
  });

  const insertResult = await params.supabase.from("staged_changes").insert(stagedPayload);
  const awaitedInsert = await insertLike(insertResult);
  if (awaitedInsert.error) {
    await updateImportLogCounts(params.supabase, logResult.id, {
      inserted_count: 0,
      skipped_count: report.rows_invalid,
      error_count: report.errors.length + stagedPayload.length,
      errors: [
        ...report.errors.slice(0, 75),
        { row: 0, message: `Failed to stage rows: ${awaitedInsert.error.message}` },
      ],
    });
    return {
      ...report,
      importLogId: logResult.id,
      stagedCount: 0,
      stageErrors: [{ message: `Failed to stage rows: ${awaitedInsert.error.message}` }],
    };
  }

  return { ...report, importLogId: logResult.id, stagedCount: stagedPayload.length, stageErrors: [] };
}

function normalizeTier1LibraryRowInternal(
  targetTable: string,
  rawRow: Record<string, unknown>,
  options: Tier1NormalizeOptions,
): NormalizeInternalResult {
  if (!isTier1LibraryTarget(targetTable)) {
    return { row: {}, issues: [{ message: `Unknown target table: ${targetTable}` }] };
  }

  const config = TIER1_LIBRARY_TARGETS[targetTable];
  const normalized: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};
  const unmappedSourceFields: Record<string, unknown> = {};
  const issues: Tier1ValidationIssue[] = [];

  for (const [rawHeader, rawValue] of Object.entries(rawRow)) {
    const trimmedHeader = rawHeader.trim();
    if (!trimmedHeader) continue;

    const canonical = canonicalHeader(trimmedHeader);
    const field = config.headerAliases[canonical] || (config.allowedFields.includes(canonical) ? canonical : null);

    if (!field) {
      if (!isEmptyValue(rawValue)) unmappedSourceFields[trimmedHeader] = rawValue;
      continue;
    }

    if (field === "metadata") {
      const parsed = coerceObject(rawValue);
      if (parsed.ok) Object.assign(metadata, parsed.value);
      else issues.push({ field, message: "Invalid metadata object" });
      continue;
    }

    const coerced = coerceField(config, field, rawValue);
    if ("message" in coerced) issues.push({ field, message: coerced.message });
    normalized[field] = coerced.value;
  }

  if (Object.keys(unmappedSourceFields).length > 0) {
    metadata.unmapped_source_fields = unmappedSourceFields;
  }
  normalized.metadata = Object.keys(metadata).length > 0 ? metadata : {};

  if (options.sourceDataset) normalized.source_dataset = options.sourceDataset;
  if (options.sourceSheet) normalized.source_sheet = options.sourceSheet;
  if (options.sourceRowNumber !== undefined) normalized.source_row_number = options.sourceRowNumber;

  return { row: normalized, issues };
}

function coerceField(
  config: Tier1LibraryTargetConfig,
  field: string,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; value: unknown; message: string } {
  if (config.arrayFields.includes(field)) {
    const parsed = coerceArray(value);
    if (!parsed.ok) return { ok: false, value: [], message: `Array field is not normalisable to an array: ${field}` };
    return { ok: true, value: parsed.value };
  }

  if (config.objectFields.includes(field)) {
    const parsed = coerceObject(value);
    if (!parsed.ok) return { ok: false, value: {}, message: `Invalid metadata object: ${field}` };
    return { ok: true, value: parsed.value };
  }

  if (config.numberFields.includes(field)) {
    const parsed = coerceNumber(value);
    if (!parsed.ok) return { ok: false, value: null, message: `Invalid number field: ${field}` };
    return { ok: true, value: parsed.value };
  }

  if (isEmptyValue(value)) {
    return {
      ok: true,
      value: config.requiredFields.includes(field) || config.primaryContentFields.includes(field) ? "" : null,
    };
  }

  return { ok: true, value: typeof value === "string" ? value.trim() : value };
}

function coerceArray(value: unknown): { ok: true; value: string[] } | { ok: false } {
  if (value == null || value === "") return { ok: true, value: [] };
  if (Array.isArray(value)) {
    return { ok: true, value: uniqueStrings(value.map((item) => String(item).trim()).filter(Boolean)) };
  }
  if (typeof value !== "string" && typeof value !== "number") return { ok: false };

  const text = String(value).trim();
  if (!text) return { ok: true, value: [] };
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return { ok: false };
      return { ok: true, value: uniqueStrings(parsed.map((item) => String(item).trim()).filter(Boolean)) };
    } catch {
      return { ok: false };
    }
  }
  return { ok: true, value: uniqueStrings(text.split(/[,;|]/).map((item) => item.trim()).filter(Boolean)) };
}

function coerceObject(value: unknown): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (value == null || value === "") return { ok: true, value: {} };
  if (typeof value === "object" && !Array.isArray(value)) return { ok: true, value: value as Record<string, unknown> };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: {} };
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false };
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

function coerceNumber(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (isEmptyValue(value)) return { ok: true, value: null };
  if (typeof value === "number") return Number.isFinite(value) ? { ok: true, value } : { ok: false };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const number = Number(trimmed);
  return Number.isFinite(number) ? { ok: true, value: number } : { ok: false };
}

function generateContentHash(targetTable: Tier1LibraryTarget, row: Record<string, unknown>): string {
  const config = TIER1_LIBRARY_TARGETS[targetTable];
  const canonical = [
    targetTable,
    ...config.hashFields.map((field) => canonicalHashValue(row[field])),
  ].join("\u001f");
  return `t1_${stableStringHash(canonical)}`;
}

function safeGenerateContentHash(targetTable: Tier1LibraryTarget, row: Record<string, unknown>): string {
  try {
    return generateContentHash(targetTable, row);
  } catch {
    return "";
  }
}

function stableStringHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function canonicalHashValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(canonicalHashValue).join("|");
  if (typeof value === "object") {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, nested]) => [key, canonicalHashValue(nested)]),
      ),
    );
  }
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

function canonicalHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function isEmptyValue(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function isBlank(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return isEmptyValue(value);
}

function rowNumberFor(index: number, row: Record<string, unknown>, options: Tier1PrepareOptions): number {
  const explicit = coerceNumber(row.source_row_number);
  if (explicit.ok && explicit.value != null) return explicit.value;
  return (options.firstDataRowNumber ?? 1) + index;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  const parsed = coerceObject(value);
  return parsed.ok ? parsed.value : {};
}

function importNote(params: Tier1ImportParams): string {
  return [
    "Tier 1 library import staging",
    params.sourceDataset ? `dataset: ${params.sourceDataset}` : "",
    params.sourceSheet ? `sheet: ${params.sourceSheet}` : "",
  ].filter(Boolean).join(" | ");
}

async function createImportLog(
  supabase: SupabaseLikeClient,
  params: Tier1ImportParams,
  report: Tier1PrepareReport,
  stagedCount: number,
): Promise<{ id?: string; error?: string }> {
  const errors = [
    ...report.errors.slice(0, 75),
    ...report.warnings.slice(0, 25).map((warning) => ({ ...warning, severity: "warning" })),
  ];
  const insertResult = supabase
    .from("import_logs")
    .insert({
      dataset: params.sourceDataset || params.targetTable,
      filename: params.sourceSheet || params.sourceUrl || params.sourceSheetId || null,
      inserted_count: stagedCount,
      updated_count: 0,
      skipped_count: report.rows_invalid,
      error_count: report.errors.length,
      errors,
      imported_by: params.importedBy ?? null,
    });

  const insertBuilder = insertResult as SupabaseInsertLike;
  const selected = insertBuilder.select?.("id").single?.();
  const result = selected ? await selected : await insertLike(insertResult);
  if (result.error) return { error: result.error.message };
  const id = result.data && typeof result.data === "object" ? String((result.data as Record<string, unknown>).id) : "";
  return id ? { id } : { error: "Import log insert did not return an id" };
}

async function updateImportLogCounts(
  supabase: SupabaseLikeClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await supabase.from("import_logs").update?.(payload).eq("id", id);
}

async function insertLike(result: unknown): Promise<SupabaseResult> {
  if (result && typeof (result as PromiseLike<SupabaseResult>).then === "function") {
    return await (result as PromiseLike<SupabaseResult>);
  }
  return { data: null, error: null };
}
