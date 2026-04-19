// Paragraph Engine seeding logic.
//
// Turns a selected thesis (+ family + route) into 3-5 distinct, structured
// paragraph cards. Pulls from existing content tables only — no schema
// duplication. Each seeded card carries:
//   - a job-derived title and claim
//   - a comparative direction drawn from comparative_matrix where possible
//   - pre-attached quote suggestions (HT / AT / Comparative buckets)
//   - a method focus prompt (from the underlying job)
//   - a context anchor (route emphasis or character_card on the family)
//   - an AO5 prompt (one tension where the family has them)
//
// The student edits down from this seed; nothing here is opinionated about
// which evidence to keep — the engine just front-loads the most likely
// useful options so cards never start blank.

import type { ContentBundle } from "@/lib/contentRepo";
import type { ParagraphJob, QuestionFamily, Thesis } from "@/data/seed";
import type { ParagraphCard } from "@/lib/planStore";
import {
  resolveParagraphJobs,
  findQuotesForFamily,
  findAO5,
} from "@/lib/planLogic";

interface SeedInput {
  family?: QuestionFamily;
  route_id?: string;
  thesis?: Thesis;
  bundle: ContentBundle;
  count?: number; // 3-5
}

/** Generate seeded paragraph cards from the current plan context. */
export function seedParagraphCards(input: SeedInput): ParagraphCard[] {
  const { family, route_id, thesis, bundle } = input;
  const targetCount = clamp(input.count ?? 3, 3, 5);

  if (!family || !route_id) return [];

  // 1. Get the underlying jobs (or synthesised ones from the thesis).
  const jobs = resolveParagraphJobs(family, route_id, thesis, bundle);
  if (!jobs.length) return [];

  // 2. Quote pool for this family, already prioritised by planLogic.
  const quotePool = findQuotesForFamily(family, bundle);
  const htPool = quotePool.filter((q) => q.source_text === "Hard Times");
  const atPool = quotePool.filter((q) => q.source_text === "Atonement");
  const cmpPool = quotePool.filter((q) => q.source_text === "Comparative");

  // 3. Comparative matrix rows that match this family — used as the
  //    "comparative direction" seed for each card. Round-robin through them
  //    so each card gets a distinct axis where possible.
  const matrixRows = bundle.comparative_matrix.filter((r) =>
    r.themes.includes(family),
  );

  // 4. AO5 tensions for the family (capped at 3 by findAO5).
  const ao5Pool = findAO5(family, bundle);

  // 5. Character anchor for context — first character whose themes overlap.
  const characterAnchor = bundle.characters.find((c) =>
    c.themes.includes(family),
  );

  // 6. Build cards. If we have fewer jobs than the requested count, repeat
  //    the last job structurally so the student has a slot to expand into;
  //    if we have more jobs than requested, take the first N.
  const slots = Array.from({ length: targetCount }, (_, i) =>
    jobs[i] ?? jobs[jobs.length - 1],
  );

  return slots.map((job, i) => buildCard({
    index: i,
    job,
    matrixRow: matrixRows[i % Math.max(matrixRows.length, 1)],
    htSeed: htPool[i] ?? htPool[0],
    atSeed: atPool[i] ?? atPool[0],
    cmpSeed: cmpPool[i],
    ao5: ao5Pool[i % Math.max(ao5Pool.length, 1)],
    characterName: characterAnchor?.name,
    routeId: route_id,
    family,
  }));
}

interface BuildArgs {
  index: number;
  job: ParagraphJob;
  matrixRow?: ContentBundle["comparative_matrix"][number];
  htSeed?: ContentBundle["quote_methods"][number];
  atSeed?: ContentBundle["quote_methods"][number];
  cmpSeed?: ContentBundle["quote_methods"][number];
  ao5?: ContentBundle["ao5_tensions"][number];
  characterName?: string;
  routeId: string;
  family: QuestionFamily;
}

function buildCard(a: BuildArgs): ParagraphCard {
  const direction = a.matrixRow
    ? `${a.matrixRow.axis}: ${a.matrixRow.divergence}`
    : a.job.divergence_prompt;

  const contextAnchor = a.characterName
    ? `Anchor through ${a.characterName} where the family allows; otherwise lean on the route's structural framing.`
    : "Lean on the route's structural framing for context (no single character forced in).";

  return {
    id: `card_${a.routeId}_${a.family}_${a.index}_${Date.now()}`,
    title: `§${String(a.index + 1).padStart(2, "0")} · ${a.job.job_title}`,
    claim: a.job.judgement_prompt,
    comparative_direction: direction,
    evidence_ht_ids: a.htSeed ? [a.htSeed.id] : [],
    evidence_at_ids: a.atSeed ? [a.atSeed.id] : [],
    evidence_cmp_ids: a.cmpSeed ? [a.cmpSeed.id] : [],
    method_focus: `${a.job.text1_prompt.split(".")[0]}. ${a.job.text2_prompt.split(".")[0]}.`,
    context_anchor: contextAnchor,
    ao5_prompt: a.ao5?.safe_stem ?? "",
    notes: "",
    seed_job_id: a.job.id,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** AO coverage assessment for a single card — drives the lightweight
 *  guidance strip beneath each card. Returns one short status per AO. */
export interface AOCoverage {
  ao1: { ok: boolean; note: string }; // claim addresses the question
  ao2: { ok: boolean; note: string }; // method focus present
  ao3: { ok: boolean; note: string }; // context anchor present
  ao4: { ok: boolean; note: string }; // both texts represented
  ao5: { ok: boolean; note: string }; // tension present (optional)
}

export function assessCoverage(card: ParagraphCard): AOCoverage {
  const claimOk = card.claim.trim().length >= 12;
  const methodOk = card.method_focus.trim().length >= 12;
  const contextOk = card.context_anchor.trim().length >= 12;
  const htCount = card.evidence_ht_ids.length;
  const atCount = card.evidence_at_ids.length;
  const bothTexts = htCount > 0 && atCount > 0;
  const ao5Present = card.ao5_prompt.trim().length > 0;

  return {
    ao1: { ok: claimOk, note: claimOk ? "Claim states a position." : "Sharpen the claim into a position." },
    ao2: { ok: methodOk, note: methodOk ? "Method focus named." : "Name the methods you'll analyse." },
    ao3: { ok: contextOk, note: contextOk ? "Context anchor set." : "Add a context anchor." },
    ao4: {
      ok: bothTexts,
      note: bothTexts
        ? "Both texts represented."
        : htCount === 0 && atCount === 0
          ? "Add evidence from both texts."
          : htCount === 0
            ? "Missing Hard Times evidence."
            : "Missing Atonement evidence.",
    },
    ao5: {
      ok: ao5Present,
      note: ao5Present ? "Critical tension noted." : "Optional: add an interpretive tension.",
    },
  };
}

/** Returns a guardrail message when comparison or method focus is weak.
 *  Empty string = no warning. */
export function comparisonGuardrail(card: ParagraphCard): string {
  const ht = card.evidence_ht_ids.length;
  const at = card.evidence_at_ids.length;
  if (ht === 0 && at === 0) return "No evidence chosen yet — pick at least one quote per text.";
  if (ht === 0) return "This card leans entirely on Atonement — add a Hard Times anchor.";
  if (at === 0) return "This card leans entirely on Hard Times — add an Atonement anchor.";
  if (ht > 2 && at === 1) return "Hard Times is dominating — consider trimming or strengthening Atonement.";
  if (at > 2 && ht === 1) return "Atonement is dominating — consider trimming or strengthening Hard Times.";
  if (!card.comparative_direction.trim()) return "Add a comparative direction so the paragraph carries the contrast.";
  return "";
}
