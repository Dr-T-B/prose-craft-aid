import {
  QUESTIONS, ROUTES, THESES, PARAGRAPH_JOBS, QUOTE_METHODS, AO5_TENSIONS,
  type Level, type QuestionFamily, type SourceText,
} from "@/data/seed";
import type { EssayPlan } from "./planStore";

export const getQuestion = (id?: string) => QUESTIONS.find((q) => q.id === id);
export const getRoute = (id?: string) => ROUTES.find((r) => r.id === id);
export const getThesisById = (id?: string) => THESES.find((t) => t.id === id);

export function findThesis(route_id?: string, family?: QuestionFamily, level?: Level) {
  if (!route_id || !family || !level) return undefined;
  return (
    THESES.find((t) => t.route_id === route_id && t.theme_family === family && t.level === level) ||
    THESES.find((t) => t.theme_family === family && t.level === level) ||
    THESES.find((t) => t.theme_family === family)
  );
}

export function findParagraphJobs(family?: QuestionFamily, route_id?: string) {
  if (!family) return [];
  const exact = PARAGRAPH_JOBS.filter((p) => p.question_family === family && p.route_id === route_id);
  if (exact.length) return exact;
  return PARAGRAPH_JOBS.filter((p) => p.question_family === family);
}

export function findQuotesForFamily(family?: QuestionFamily) {
  if (!family) return [];
  return QUOTE_METHODS.filter((q) => q.best_themes.includes(family));
}

export function groupQuotesBySource(qs: ReturnType<typeof findQuotesForFamily>) {
  const groups: Record<SourceText, typeof qs> = { "Hard Times": [], "Atonement": [], "Comparative": [] };
  qs.forEach((q) => groups[q.source_text].push(q));
  return groups;
}

export function findAO5(family?: QuestionFamily) {
  if (!family) return [];
  return AO5_TENSIONS.filter((a) => a.best_use.includes(family)).slice(0, 3);
}

/** Render plan as plain text for copy / print. */
export function renderPlanText(plan: EssayPlan): string {
  const q = getQuestion(plan.question_id);
  const r = getRoute(plan.route_id);
  const t = getThesisById(plan.thesis_id) || findThesis(plan.route_id, plan.family, plan.thesis_level);
  const jobs = findParagraphJobs(plan.family, plan.route_id);
  const quotes = QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id));
  const ao5s = AO5_TENSIONS.filter((a) => plan.selected_ao5_ids.includes(a.id));
  const lines: string[] = [];
  lines.push("COMPONENT 2 PROSE — ESSAY PLAN");
  lines.push("");
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
