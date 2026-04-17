import {
  QUESTIONS, ROUTES, THESES, PARAGRAPH_JOBS, QUOTE_METHODS, AO5_TENSIONS,
  type Level, type QuestionFamily, type SourceText, type ParagraphJob, type QuoteMethod,
  type Question, type Route, type Thesis, type AO5Tension,
} from "@/data/seed";
import type { EssayPlan } from "./planStore";

/** Optional content bundle override — pages pass remote data here so logic
 *  resolves against Supabase content first, with the local seed as fallback. */
export interface ContentSlice {
  questions?: Question[];
  routes?: Route[];
  theses?: Thesis[];
  paragraph_jobs?: ParagraphJob[];
  quote_methods?: QuoteMethod[];
  ao5_tensions?: AO5Tension[];
}

const pick = <T,>(remote: T[] | undefined, fallback: T[]): T[] =>
  remote && remote.length > 0 ? remote : fallback;

export const getQuestion = (id?: string, c?: ContentSlice) =>
  pick(c?.questions, QUESTIONS).find((q) => q.id === id);
export const getRoute = (id?: string, c?: ContentSlice) =>
  pick(c?.routes, ROUTES).find((r) => r.id === id);
export const getThesisById = (id?: string, c?: ContentSlice) =>
  pick(c?.theses, THESES).find((t) => t.id === id);

const LEVEL_ORDER: Level[] = ["secure", "strong", "top_band"];

/** Deterministic thesis match.
 *  Cascade:
 *    1. exact: route + family + level
 *    2. route + family (closest level)
 *    3. route + level (any family on that route)
 *    4. family + level (any route)
 *    5. family (any route, closest level)
 *  Never returns undefined when family is provided AND any thesis exists for it.
 */
export function findThesis(route_id?: string, family?: QuestionFamily, level?: Level, c?: ContentSlice) {
  if (!family) return undefined;
  const T = pick(c?.theses, THESES);

  // 1. exact
  if (route_id && level) {
    const exact = T.find((t) => t.route_id === route_id && t.theme_family === family && t.level === level);
    if (exact) return exact;
  }
  // 2. route + family — pick closest level
  if (route_id) {
    const onRoute = T.filter((t) => t.route_id === route_id && t.theme_family === family);
    if (onRoute.length) return pickClosestLevel(onRoute, level);
  }
  // 3. route + level (any family on the route)
  if (route_id && level) {
    const routeLevel = T.find((t) => t.route_id === route_id && t.level === level);
    if (routeLevel) return routeLevel;
  }
  // 4. family + level
  if (level) {
    const fl = T.find((t) => t.theme_family === family && t.level === level);
    if (fl) return fl;
  }
  // 5. family — closest level
  const familyOnly = T.filter((t) => t.theme_family === family);
  if (familyOnly.length) return pickClosestLevel(familyOnly, level);

  return undefined;
}

function pickClosestLevel<T extends { level: Level }>(items: T[], target?: Level): T {
  if (!target) {
    // deterministic: prefer "strong"
    return items.find((i) => i.level === "strong") ?? items[0];
  }
  const targetIdx = LEVEL_ORDER.indexOf(target);
  return [...items].sort((a, b) =>
    Math.abs(LEVEL_ORDER.indexOf(a.level) - targetIdx) -
    Math.abs(LEVEL_ORDER.indexOf(b.level) - targetIdx)
  )[0];
}

/** Paragraph jobs with hard fallback to thesis labels (so section is never empty). */
export function findParagraphJobs(family?: QuestionFamily, route_id?: string, c?: ContentSlice): ParagraphJob[] {
  if (!family) return [];
  const PJ = pick(c?.paragraph_jobs, PARAGRAPH_JOBS);
  const exact = PJ.filter((p) => p.question_family === family && p.route_id === route_id);
  if (exact.length) return exact;
  const familyOnly = PJ.filter((p) => p.question_family === family);
  if (familyOnly.length) return familyOnly;
  return [];
}

/** Build synthetic paragraph jobs from a thesis when no real jobs exist.
 *  Used by Builder/Live/Timed so the paragraph section is never blank. */
export function synthesiseJobsFromThesis(thesis: { paragraph_job_1_label: string; paragraph_job_2_label: string; paragraph_job_3_label?: string | null }, family: QuestionFamily, route_id: string): ParagraphJob[] {
  const labels = [thesis.paragraph_job_1_label, thesis.paragraph_job_2_label, thesis.paragraph_job_3_label].filter(Boolean) as string[];
  return labels.map((lbl, i) => ({
    id: `synth_${family}_${route_id}_${i}`,
    question_family: family,
    route_id,
    job_title: lbl,
    text1_prompt: "Anchor in a concrete Hard Times moment relevant to this job.",
    text2_prompt: "Pair with a parallel Atonement moment that shows the same job from McEwan's angle.",
    divergence_prompt: "Name the divergence — what each writer does that the other does not.",
    judgement_prompt: "End with a one-sentence judgement that answers the question wording.",
  }));
}

/** Resolve final paragraph jobs for a plan, always non-empty when family + route exist. */
export function resolveParagraphJobs(family?: QuestionFamily, route_id?: string, thesis?: ReturnType<typeof findThesis>, c?: ContentSlice): ParagraphJob[] {
  const jobs = findParagraphJobs(family, route_id, c);
  if (jobs.length) return jobs;
  if (thesis && family && route_id) return synthesiseJobsFromThesis(thesis, family, route_id);
  return [];
}

/** Per-family priority list of quote IDs to surface first.
 *  Drives ordering inside each source group. */
const QUOTE_PRIORITY: Partial<Record<QuestionFamily, string[]>> = {
  class: ["qm_hands", "qm_girl20", "qm_cleaner", "qm_cmp_voice", "qm_cmp_repair"],
  guilt: ["qm_truth_real", "qm_atonement", "qm_ghostly", "qm_cmp_repair", "qm_cmp_authority", "qm_cleaner"],
  truth: ["qm_ghostly", "qm_atonement", "qm_facts", "qm_cmp_authority", "qm_cmp_imag", "qm_truth_real"],
  imagination: ["qm_fire", "qm_alive", "qm_cmp_imag", "qm_truth_real", "qm_facts"],
  childhood: ["qm_girl20", "qm_fire", "qm_cmp_imag", "qm_facts"],
};

export function findQuotesForFamily(family?: QuestionFamily, c?: ContentSlice): QuoteMethod[] {
  if (!family) return [];
  const QM = pick(c?.quote_methods, QUOTE_METHODS);
  const matches = QM.filter((q) => q.best_themes.includes(family));
  const priority = QUOTE_PRIORITY[family] ?? [];
  // Sort: priority list order first (in given order), then the rest.
  return [...matches].sort((a, b) => {
    const ai = priority.indexOf(a.id);
    const bi = priority.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

const MAX_PER_GROUP = 4;

export function groupQuotesBySource(qs: QuoteMethod[]): Record<SourceText, QuoteMethod[]> {
  const groups: Record<SourceText, QuoteMethod[]> = { "Hard Times": [], "Atonement": [], "Comparative": [] };
  qs.forEach((q) => groups[q.source_text].push(q));
  // cap each group
  (Object.keys(groups) as SourceText[]).forEach((k) => {
    groups[k] = groups[k].slice(0, MAX_PER_GROUP);
  });
  return groups;
}

export function findAO5(family?: QuestionFamily, c?: ContentSlice) {
  if (!family) return [];
  return pick(c?.ao5_tensions, AO5_TENSIONS).filter((a) => a.best_use.includes(family)).slice(0, 3);
}

/** Render plan as plain text for copy / print. Always renders a usable plan even
 *  when partial — falls back to a summary block so timed practice is never empty. */
export function renderPlanText(plan: EssayPlan): string {
  const q = getQuestion(plan.question_id);
  const r = getRoute(plan.route_id);
  const t = getThesisById(plan.thesis_id) || findThesis(plan.route_id, plan.family, plan.thesis_level);
  const jobs = resolveParagraphJobs(plan.family, plan.route_id, t);
  const quotes = QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id));
  const ao5s = AO5_TENSIONS.filter((a) => plan.selected_ao5_ids.includes(a.id));
  const lines: string[] = [];
  lines.push("COMPONENT 2 PROSE — ESSAY PLAN");
  lines.push("");

  if (!q && !r && !t) {
    lines.push("(No plan built yet.)");
    lines.push("Open the Essay Builder to choose a question, route, and thesis level.");
    return lines.join("\n");
  }

  if (q) { lines.push("QUESTION"); lines.push(q.stem); lines.push(""); }
  if (r) { lines.push("ROUTE"); lines.push(`${r.name} — ${r.core_question}`); lines.push(""); }
  if (t) {
    lines.push(`THESIS (${plan.thesis_level.toUpperCase()})`);
    lines.push(t.thesis_text);
    lines.push("");
  }
  if (jobs.length) {
    lines.push("PARAGRAPH JOBS");
    jobs.forEach((j, i) => {
      lines.push(`§${i + 1} ${j.job_title}`);
      lines.push(`  Hard Times: ${j.text1_prompt}`);
      lines.push(`  Atonement:  ${j.text2_prompt}`);
      lines.push(`  Divergence: ${j.divergence_prompt}`);
      lines.push(`  Judgement:  ${j.judgement_prompt}`);
      lines.push("");
    });
  }
  if (quotes.length) {
    lines.push("SELECTED QUOTES & METHODS");
    quotes.forEach((qm) => {
      lines.push(`• [${qm.source_text}] "${qm.quote_text}" — ${qm.method}`);
      lines.push(`    ${qm.effect_prompt}`);
    });
    lines.push("");
  }
  if (plan.ao5_enabled && ao5s.length) {
    lines.push("AO5 TENSIONS");
    ao5s.forEach((a) => {
      lines.push(`• ${a.focus}`);
      lines.push(`    ${a.safe_stem}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}
