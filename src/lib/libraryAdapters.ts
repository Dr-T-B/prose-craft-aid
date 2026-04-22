// Future curated Supabase targets for Explore mode. The current runtime still
// adapts the existing ContentProvider bundle (for example quote_methods) until
// these library_* tables exist and are deliberately wired in.
export const LIBRARY_TABLES = {
  quotes: "library_quotes",
  questions: "library_questions",
  comparativePairings: "library_comparative_pairings",
  thesisBank: "library_thesis_bank",
  paragraphFrames: "library_paragraph_frames",
  contextBank: "library_context_bank",
} as const;

export type LibraryLevel = "secure" | "strong" | "top_band";
export type LibrarySourceText = "Hard Times" | "Atonement" | "Comparative";
export type LibraryThemeId =
  | "childhood" | "class" | "guilt" | "imagination" | "truth"
  | "love" | "gender" | "suffering" | "power" | "endings"
  | "narrative_authority" | "war_industrialism";

export const LIBRARY_THEME_LABELS: Record<LibraryThemeId, string> = {
  childhood: "Childhood",
  class: "Class",
  guilt: "Guilt",
  imagination: "Imagination",
  truth: "Truth & Storytelling",
  love: "Love",
  gender: "Gender & Agency",
  suffering: "Suffering",
  power: "Power",
  endings: "Endings",
  narrative_authority: "Narrative Authority",
  war_industrialism: "War / Industrialism",
};
export const LIBRARY_THEME_ORDER = Object.keys(LIBRARY_THEME_LABELS) as LibraryThemeId[];

export function getLibraryThemeLabel(theme: LibraryThemeId) {
  return LIBRARY_THEME_LABELS[theme] ?? theme;
}

export interface LibraryQuote {
  id: string;
  sourceText: LibrarySourceText | "Unknown";
  quoteText: string;
  method: string;
  themes: LibraryThemeId[];
  effect: string;
  meaning: string;
  level: LibraryLevel | "unlevelled";
  speakerOrNarrator?: string | null;
  locationReference?: string | null;
  plainEnglishMeaning?: string | null;
  linkedMotifs: string[];
  linkedContext: string[];
  linkedInterpretations: string[];
  openingStems: string[];
  comparativePrompts: string[];
  gradePriority?: string | null;
  isCoreQuote: boolean;
  aoPriority: string[];
  comparisonStrength?: string | null;
  retrievalPriority?: number | null;
  bestUsedFor: string[];
}

export interface LibraryQuoteGroup {
  family: LibraryThemeId;
  quotes: LibraryQuote[];
}

export interface LibraryRouteRef {
  id: string;
  name: string;
  coreQuestion?: string;
}

export interface LibraryQuestion {
  id: string;
  family: LibraryThemeId;
  familyLabel: string;
  stem: string;
  level: LibraryLevel | "unlevelled";
  primaryRoute?: LibraryRouteRef;
  secondaryRoute?: LibraryRouteRef;
  likelyMethods: string[];
}

export interface LibraryParagraphFrame {
  id: string;
  family: LibraryThemeId;
  familyLabel: string;
  route?: LibraryRouteRef;
  title: string;
  hardTimesPrompt: string;
  atonementPrompt: string;
  divergencePrompt: string;
  judgementPrompt: string;
}

export interface LibraryThesis {
  id: string;
  family: LibraryThemeId;
  familyLabel: string;
  route?: LibraryRouteRef;
  level: LibraryLevel | "unlevelled";
  thesisText: string;
  paragraphLabels: string[];
  paragraphFrames: LibraryParagraphFrame[];
}

export type LibraryContextKind = "character" | "symbol" | "theme" | "ao5";

export interface LibraryContextItem {
  id: string;
  kind: LibraryContextKind;
  title: string;
  summary: string;
  sourceText: LibrarySourceText | "Unknown";
  themes: LibraryThemeId[];
  level?: LibraryLevel | "unlevelled";
  details: {
    label: string;
    value: string;
  }[];
}

export interface LibraryRawRouteRow {
  id?: string;
  name?: string;
  core_question?: string;
}

export interface LibraryRawQuoteRow {
  id?: string;
  source_text?: unknown;
  quote_text?: string;
  method?: string;
  best_themes?: unknown;
  effect_prompt?: string;
  meaning_prompt?: string;
  level_tag?: LibraryLevel;
  speaker_or_narrator?: string | null;
  location_reference?: string | null;
  plain_english_meaning?: string | null;
  linked_motifs?: string[] | null;
  linked_context?: string[] | null;
  linked_interpretations?: string[] | null;
  opening_stems?: string[] | null;
  comparative_prompts?: string[] | null;
  grade_priority?: string | null;
  is_core_quote?: boolean | null;
  ao_priority?: string[] | null;
  comparison_strength?: string | null;
  retrieval_priority?: number | null;
  best_used_for?: string[] | null;
}

export interface LibraryRawQuestionRow {
  id?: string;
  family?: unknown;
  stem?: string;
  primary_route_id?: string;
  secondary_route_id?: string;
  likely_core_methods?: string[] | null;
  level_tag?: LibraryLevel;
}

export interface LibraryRawThesisRow {
  id?: string;
  route_id?: string;
  theme_family?: unknown;
  level?: LibraryLevel;
  thesis_text?: string;
  paragraph_job_1_label?: string;
  paragraph_job_2_label?: string;
  paragraph_job_3_label?: string | null;
}

export interface LibraryRawParagraphJobRow {
  id?: string;
  question_family?: unknown;
  route_id?: string;
  job_title?: string;
  text1_prompt?: string;
  text2_prompt?: string;
  divergence_prompt?: string;
  judgement_prompt?: string;
}

export interface LibraryRawCharacterRow {
  id?: string;
  source_text?: unknown;
  name?: string;
  one_line?: string;
  themes?: unknown;
  core_function?: string;
  complication?: string;
  structural_role?: string;
  comparative_link?: string;
  common_misreading?: string;
}

export interface LibraryRawSymbolRow {
  id?: string;
  source_text?: unknown;
  name?: string;
  one_line?: string;
  themes?: unknown;
}

export interface LibraryRawThemeRow {
  id?: string;
  family?: unknown;
  one_line?: string;
}

export interface LibraryRawAO5Row {
  id?: string;
  focus?: string;
  dominant_reading?: string;
  alternative_reading?: string;
  safe_stem?: string;
  best_use?: unknown;
  level_tag?: LibraryLevel;
}

const KNOWN_SOURCES: LibrarySourceText[] = ["Hard Times", "Atonement", "Comparative"];

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asSource(value: unknown): LibraryQuote["sourceText"] {
  return typeof value === "string" && KNOWN_SOURCES.includes(value as LibrarySourceText)
    ? (value as LibrarySourceText)
    : "Unknown";
}

function asContextSource(value: unknown): LibraryContextItem["sourceText"] {
  return asSource(value);
}

function asThemes(value: unknown): LibraryThemeId[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(LIBRARY_THEME_ORDER);
  return value.filter((theme): theme is LibraryThemeId => typeof theme === "string" && valid.has(theme as LibraryThemeId));
}

function asTheme(value: unknown): LibraryThemeId {
  const valid = new Set(LIBRARY_THEME_ORDER);
  return typeof value === "string" && valid.has(value as LibraryThemeId)
    ? (value as LibraryThemeId)
    : "truth";
}

function cleanText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function routeRef(routeId: string | undefined, routeMap: Map<string, LibraryRawRouteRow>): LibraryRouteRef | undefined {
  if (!routeId) return undefined;
  const route = routeMap.get(routeId);
  return {
    id: routeId,
    name: route?.name || routeId,
    coreQuestion: route?.core_question,
  };
}

export function toLibraryQuote(row: LibraryRawQuoteRow): LibraryQuote {
  return {
    id: row.id || `quote-${row.quote_text || "untitled"}`,
    sourceText: asSource(row.source_text),
    quoteText: row.quote_text || "Quote text unavailable",
    method: row.method || "",
    themes: asThemes(row.best_themes),
    effect: row.effect_prompt || "",
    meaning: row.meaning_prompt || "",
    level: row.level_tag || "unlevelled",
    speakerOrNarrator: row.speaker_or_narrator,
    locationReference: row.location_reference,
    plainEnglishMeaning: row.plain_english_meaning,
    linkedMotifs: asArray(row.linked_motifs),
    linkedContext: asArray(row.linked_context),
    linkedInterpretations: asArray(row.linked_interpretations),
    openingStems: asArray(row.opening_stems),
    comparativePrompts: asArray(row.comparative_prompts),
    gradePriority: row.grade_priority,
    isCoreQuote: Boolean(row.is_core_quote),
    aoPriority: asArray(row.ao_priority),
    comparisonStrength: row.comparison_strength,
    retrievalPriority: row.retrieval_priority,
    bestUsedFor: asArray(row.best_used_for),
  };
}

export function toLibraryQuotes(rows: LibraryRawQuoteRow[] | undefined): LibraryQuote[] {
  return (rows ?? []).map(toLibraryQuote);
}

export function toLibraryQuestion(row: LibraryRawQuestionRow, routes: LibraryRawRouteRow[] = []): LibraryQuestion {
  const family = asTheme(row.family);
  const routeMap = new Map(routes.map((route) => [route.id, route]).filter(([id]) => Boolean(id)) as [string, LibraryRawRouteRow][]);

  return {
    id: row.id || `question-${row.stem || "untitled"}`,
    family,
    familyLabel: getLibraryThemeLabel(family),
    stem: cleanText(row.stem, "Question stem unavailable"),
    level: row.level_tag || "unlevelled",
    primaryRoute: routeRef(row.primary_route_id, routeMap),
    secondaryRoute: routeRef(row.secondary_route_id, routeMap),
    likelyMethods: asArray(row.likely_core_methods),
  };
}

export function toLibraryQuestions(rows: LibraryRawQuestionRow[] | undefined, routes: LibraryRawRouteRow[] = []): LibraryQuestion[] {
  return (rows ?? []).map((row) => toLibraryQuestion(row, routes));
}

export function questionMatchesText(question: LibraryQuestion, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    question.stem,
    question.familyLabel,
    question.level,
    question.primaryRoute?.name,
    question.primaryRoute?.coreQuestion,
    question.secondaryRoute?.name,
    question.secondaryRoute?.coreQuestion,
    ...question.likelyMethods,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function toLibraryParagraphFrame(row: LibraryRawParagraphJobRow, routes: LibraryRawRouteRow[] = []): LibraryParagraphFrame {
  const family = asTheme(row.question_family);
  const routeMap = new Map(routes.map((route) => [route.id, route]).filter(([id]) => Boolean(id)) as [string, LibraryRawRouteRow][]);

  return {
    id: row.id || `paragraph-frame-${row.route_id || "route"}-${family}-${row.job_title || "untitled"}`,
    family,
    familyLabel: getLibraryThemeLabel(family),
    route: routeRef(row.route_id, routeMap),
    title: cleanText(row.job_title, "Untitled paragraph job"),
    hardTimesPrompt: cleanText(row.text1_prompt, "No Hard Times prompt available."),
    atonementPrompt: cleanText(row.text2_prompt, "No Atonement prompt available."),
    divergencePrompt: cleanText(row.divergence_prompt, "No divergence prompt available."),
    judgementPrompt: cleanText(row.judgement_prompt, "No judgement prompt available."),
  };
}

export function toLibraryParagraphFrames(
  rows: LibraryRawParagraphJobRow[] | undefined,
  routes: LibraryRawRouteRow[] = [],
): LibraryParagraphFrame[] {
  return (rows ?? []).map((row) => toLibraryParagraphFrame(row, routes));
}

export function toLibraryThesis(
  row: LibraryRawThesisRow,
  routes: LibraryRawRouteRow[] = [],
  paragraphJobs: LibraryRawParagraphJobRow[] = [],
): LibraryThesis {
  const family = asTheme(row.theme_family);
  const routeMap = new Map(routes.map((route) => [route.id, route]).filter(([id]) => Boolean(id)) as [string, LibraryRawRouteRow][]);
  const paragraphLabels = [row.paragraph_job_1_label, row.paragraph_job_2_label, row.paragraph_job_3_label]
    .filter((label): label is string => typeof label === "string" && label.trim().length > 0);
  const matchingFrames = paragraphJobs
    .filter((job) => job.route_id === row.route_id && asTheme(job.question_family) === family)
    .map((job) => toLibraryParagraphFrame(job, routes));

  return {
    id: row.id || `thesis-${row.route_id || "route"}-${family}-${row.level || "unlevelled"}`,
    family,
    familyLabel: getLibraryThemeLabel(family),
    route: routeRef(row.route_id, routeMap),
    level: row.level || "unlevelled",
    thesisText: cleanText(row.thesis_text, "Thesis text unavailable."),
    paragraphLabels,
    paragraphFrames: matchingFrames,
  };
}

export function toLibraryTheses(
  rows: LibraryRawThesisRow[] | undefined,
  routes: LibraryRawRouteRow[] = [],
  paragraphJobs: LibraryRawParagraphJobRow[] = [],
): LibraryThesis[] {
  return (rows ?? []).map((row) => toLibraryThesis(row, routes, paragraphJobs));
}

export function thesisMatchesText(thesis: LibraryThesis, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    thesis.thesisText,
    thesis.familyLabel,
    thesis.level,
    thesis.route?.name,
    thesis.route?.coreQuestion,
    ...thesis.paragraphLabels,
    ...thesis.paragraphFrames.flatMap((frame) => [
      frame.title,
      frame.hardTimesPrompt,
      frame.atonementPrompt,
      frame.divergencePrompt,
      frame.judgementPrompt,
    ]),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function detail(label: string, value: unknown): LibraryContextItem["details"][number] | undefined {
  const text = cleanText(value);
  return text ? { label, value: text } : undefined;
}

function compactDetails(details: (LibraryContextItem["details"][number] | undefined)[]) {
  return details.filter((item): item is LibraryContextItem["details"][number] => Boolean(item));
}

export function toLibraryContextFromCharacters(rows: LibraryRawCharacterRow[] | undefined): LibraryContextItem[] {
  return (rows ?? []).map((row) => ({
    id: row.id || `character-${row.name || "untitled"}`,
    kind: "character",
    title: cleanText(row.name, "Unnamed character"),
    summary: cleanText(row.one_line, "No contextual summary available."),
    sourceText: asContextSource(row.source_text),
    themes: asThemes(row.themes),
    details: compactDetails([
      detail("Core function", row.core_function),
      detail("Complication", row.complication),
      detail("Structural role", row.structural_role),
      detail("Comparative link", row.comparative_link),
      detail("Common misreading", row.common_misreading),
    ]),
  }));
}

export function toLibraryContextFromSymbols(rows: LibraryRawSymbolRow[] | undefined): LibraryContextItem[] {
  return (rows ?? []).map((row) => ({
    id: row.id || `symbol-${row.name || "untitled"}`,
    kind: "symbol",
    title: cleanText(row.name, "Unnamed symbol"),
    summary: cleanText(row.one_line, "No contextual summary available."),
    sourceText: asContextSource(row.source_text),
    themes: asThemes(row.themes),
    details: [],
  }));
}

export function toLibraryContextFromThemes(rows: LibraryRawThemeRow[] | undefined): LibraryContextItem[] {
  return (rows ?? []).map((row) => {
    const family = asTheme(row.family);
    return {
      id: row.id || `theme-${family}`,
      kind: "theme",
      title: getLibraryThemeLabel(family),
      summary: cleanText(row.one_line, "No theme summary available."),
      sourceText: "Comparative",
      themes: [family],
      details: [],
    };
  });
}

export function toLibraryContextFromAO5(rows: LibraryRawAO5Row[] | undefined): LibraryContextItem[] {
  return (rows ?? []).map((row) => ({
    id: row.id || `ao5-${row.focus || "untitled"}`,
    kind: "ao5",
    title: cleanText(row.focus, "Unnamed AO5 tension"),
    summary: cleanText(row.safe_stem, "No AO5 stem available."),
    sourceText: "Comparative",
    themes: asThemes(row.best_use),
    level: row.level_tag || "unlevelled",
    details: compactDetails([
      detail("Dominant reading", row.dominant_reading),
      detail("Alternative reading", row.alternative_reading),
      detail("Safe stem", row.safe_stem),
    ]),
  }));
}

export function contextMatchesText(item: LibraryContextItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    item.title,
    item.summary,
    item.sourceText,
    item.kind,
    item.level,
    ...item.themes.map(getLibraryThemeLabel),
    ...item.details.flatMap((entry) => [entry.label, entry.value]),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function libraryContextKindSupportsSourceFilter(kind: LibraryContextKind): boolean {
  return kind === "character" || kind === "symbol";
}

export function quoteMatchesText(quote: LibraryQuote, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    quote.quoteText,
    quote.sourceText,
    quote.method,
    quote.effect,
    quote.meaning,
    quote.speakerOrNarrator,
    quote.locationReference,
    quote.plainEnglishMeaning,
    quote.comparisonStrength,
    ...quote.bestUsedFor,
    ...quote.linkedMotifs,
    ...quote.linkedContext,
    ...quote.linkedInterpretations,
    ...quote.openingStems,
    ...quote.comparativePrompts,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function groupLibraryQuotesByTheme(quotes: LibraryQuote[]): {
  groups: LibraryQuoteGroup[];
  untagged: LibraryQuote[];
  uniqueCount: number;
} {
  const groups = LIBRARY_THEME_ORDER
    .map((family) => ({
      family,
      quotes: quotes.filter((quote) => quote.themes.includes(family)),
    }))
    .filter((group) => group.quotes.length > 0);

  const untagged = quotes.filter((quote) => quote.themes.length === 0);
  const ids = new Set<string>();
  groups.forEach((group) => group.quotes.forEach((quote) => ids.add(quote.id)));
  untagged.forEach((quote) => ids.add(quote.id));

  return { groups, untagged, uniqueCount: ids.size };
}
