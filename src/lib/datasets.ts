// Central registry for all curriculum datasets, used by the admin Data Manager.
// Listed in import priority order (content first, user-state last).

export type DatasetKey =
  | "routes"
  | "questions"
  | "theses"
  | "paragraph_jobs"
  | "quote_methods"
  | "character_cards"
  | "theme_maps"
  | "symbol_entries"
  | "comparative_matrix"
  | "ao5_tensions"
  | "saved_essay_plans"
  | "timed_sessions"
  | "reflection_entries";

export type IdType = "text" | "uuid";

export interface DatasetMeta {
  key: DatasetKey;
  label: string;
  description: string;
  /** Primary key id type (matches DB schema). */
  idType: IdType;
  /** Tier — content tables are imported first, user-state tables last. */
  tier: "content" | "user-state";
  /** Columns required in the CSV (id is always required and enforced separately). */
  requiredColumns: string[];
  /** Columns parsed as text[] (semicolon/pipe-separated, or JSON array). */
  arrayColumns?: string[];
  /** Columns parsed as integers. */
  integerColumns?: string[];
  /** Columns parsed as booleans (true/false/1/0/yes/no). */
  booleanColumns?: string[];
  /** Columns parsed as jsonb (JSON literal). */
  jsonColumns?: string[];
  /** Columns parsed as ISO timestamps. */
  timestampColumns?: string[];
  /** Columns parsed as uuid (validated; blanks become null). */
  uuidColumns?: string[];
}

export const DATASETS: DatasetMeta[] = [
  // -------- Content (text ids) --------
  {
    key: "routes",
    label: "Routes",
    description: "Argument routes through a question.",
    idType: "text",
    tier: "content",
    requiredColumns: ["name", "core_question"],
  },
  {
    key: "questions",
    label: "Questions",
    description: "Exam questions with route and method tagging.",
    idType: "text",
    tier: "content",
    requiredColumns: ["family", "stem"],
    arrayColumns: ["likely_core_methods"],
  },
  {
    key: "theses",
    label: "Theses",
    description: "Thesis statements with paragraph-job labels.",
    idType: "text",
    tier: "content",
    requiredColumns: ["thesis_text", "route_id"],
  },
  {
    key: "paragraph_jobs",
    label: "Paragraph Jobs",
    description: "Paragraph functions and prompts per route.",
    idType: "text",
    tier: "content",
    requiredColumns: ["job_title", "route_id"],
  },
  {
    key: "quote_methods",
    label: "Quote Methods",
    description: "Quotations with method and effect/meaning prompts.",
    idType: "text",
    tier: "content",
    requiredColumns: ["quote_text", "method"],
    arrayColumns: ["best_themes"],
  },
  {
    key: "character_cards",
    label: "Character Cards",
    description: "Character profiles, functions and complications.",
    idType: "text",
    tier: "content",
    requiredColumns: ["name", "source_text"],
    arrayColumns: ["themes"],
  },
  {
    key: "theme_maps",
    label: "Theme Maps",
    description: "Theme families with one-line summaries.",
    idType: "text",
    tier: "content",
    requiredColumns: ["family", "one_line"],
  },
  {
    key: "symbol_entries",
    label: "Symbols",
    description: "Symbolic motifs and their thematic roles.",
    idType: "text",
    tier: "content",
    requiredColumns: ["name", "source_text", "one_line"],
    arrayColumns: ["themes"],
  },
  {
    key: "comparative_matrix",
    label: "Comparative Matrix",
    description: "Hard Times vs Atonement axis comparisons.",
    idType: "text",
    tier: "content",
    requiredColumns: ["axis", "hard_times", "atonement", "divergence"],
    arrayColumns: ["themes"],
  },
  {
    key: "ao5_tensions",
    label: "AO5 Tensions",
    description: "Dominant vs alternative critical readings.",
    idType: "text",
    tier: "content",
    requiredColumns: ["focus", "dominant_reading", "alternative_reading", "safe_stem", "level_tag"],
    arrayColumns: ["best_use"],
  },
  // -------- User-state (uuid ids) --------
  {
    key: "saved_essay_plans",
    label: "Essay Plans",
    description: "Saved essay plans (user-state).",
    idType: "uuid",
    tier: "user-state",
    requiredColumns: [],
    uuidColumns: ["user_id"],
    booleanColumns: ["ao5_enabled"],
    arrayColumns: ["paragraph_job_ids", "selected_quote_ids", "selected_ao5_ids"],
  },
  {
    key: "timed_sessions",
    label: "Timed Sessions",
    description: "Timed essay-writing sessions (user-state).",
    idType: "uuid",
    tier: "user-state",
    requiredColumns: ["mode_id"],
    uuidColumns: ["user_id", "plan_id"],
    integerColumns: ["duration_minutes", "word_count"],
    booleanColumns: ["completed", "expired"],
    timestampColumns: ["started_at", "ended_at"],
  },
  {
    key: "reflection_entries",
    label: "Reflections",
    description: "Reflection checklists per session (user-state).",
    idType: "uuid",
    tier: "user-state",
    requiredColumns: ["session_id"],
    uuidColumns: ["user_id", "session_id"],
    jsonColumns: ["checklist"],
  },
];

export const DATASET_BY_KEY: Record<DatasetKey, DatasetMeta> = Object.fromEntries(
  DATASETS.map((d) => [d.key, d]),
) as Record<DatasetKey, DatasetMeta>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: string): boolean {
  return UUID_RE.test(v.trim());
}
