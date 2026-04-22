import type {
  LibraryComparativePairing,
  LibraryContextItem,
  LibraryLevel,
  LibraryParagraphFrame,
  LibraryQuestion,
  LibraryQuote,
  LibraryThemeId,
  LibraryThesis,
} from "@/lib/libraryAdapters";
import { getCurrentPlan, setCurrentPlan } from "@/lib/planStore";

export type BuilderHandoffKind =
  | "question"
  | "quote"
  | "context"
  | "thesis"
  | "paragraph_frame"
  | "comparison";

export type BuilderHandoffOrigin =
  | "quotes"
  | "questions"
  | "context"
  | "thesis"
  | "comparison";

// Normalized, lightweight payload passed from Explore into the Builder plan.
// Durable ownership belongs to EssayPlan.builder_handoffs in planStore; this
// module only creates payloads and performs intake/merge operations.
export interface BuilderHandoffItem {
  id: string;
  kind: BuilderHandoffKind;
  originModule: BuilderHandoffOrigin;
  label: string;
  title: string;
  text: string;
  canonicalId?: string;
  sourceText?: string;
  family?: LibraryThemeId;
  routeId?: string;
  routeLabel?: string;
  level?: LibraryLevel | "unlevelled";
  metadata?: Record<string, string | string[]>;
}

interface HandoffPlanLike {
  selected_quote_ids: string[];
  builder_handoffs?: BuilderHandoffItem[];
}

export type BuilderHandoffPlanPatch = Partial<HandoffPlanLike> & {
  family?: LibraryThemeId;
  question_id?: string;
  route_id?: string;
  thesis_id?: string;
  thesis_level?: LibraryLevel;
};

// Legacy route-transport queue from the first handoff pass. This module does
// not write to it anymore, so it cannot become duplicate long-lived state.
// Builder consumes and clears it only as a fallback for older in-flight items.
const KEY_HANDOFF_QUEUE = "c2p.builderHandoffQueue.v1";

function readQueue(): BuilderHandoffItem[] {
  try {
    const raw = localStorage.getItem(KEY_HANDOFF_QUEUE);
    return raw ? (JSON.parse(raw) as BuilderHandoffItem[]) : [];
  } catch {
    return [];
  }
}

function dedupeHandoffs(items: BuilderHandoffItem[]): BuilderHandoffItem[] {
  const byId = new Map<string, BuilderHandoffItem>();
  items.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values());
}

export function queueBuilderHandoff(item: BuilderHandoffItem) {
  integrateBuilderHandoffsIntoCurrentPlan([item]);
}

// The current plan is the durable owner of imported Explore items.
export function integrateBuilderHandoffsIntoCurrentPlan(incoming: BuilderHandoffItem[]) {
  const plan = getCurrentPlan();
  const patch = mergeBuilderHandoffsIntoPlan(plan, incoming);
  const next = { ...plan, ...patch, updated_at: Date.now() };
  setCurrentPlan(next);
  return next;
}

export function consumeQueuedBuilderHandoffs(): BuilderHandoffItem[] {
  const items = readQueue();
  try { localStorage.removeItem(KEY_HANDOFF_QUEUE); } catch { /* noop */ }
  return items;
}

export function mergeBuilderHandoffsIntoPlan(
  plan: HandoffPlanLike,
  incoming: BuilderHandoffItem[],
): BuilderHandoffPlanPatch {
  const builder_handoffs = dedupeHandoffs([...(plan.builder_handoffs ?? []), ...incoming]);
  const patch: BuilderHandoffPlanPatch = { builder_handoffs };
  const selectedQuoteIds = [...plan.selected_quote_ids];

  incoming.forEach((item) => {
    if (item.kind === "quote" && item.canonicalId && !selectedQuoteIds.includes(item.canonicalId)) {
      selectedQuoteIds.push(item.canonicalId);
    }

    if (item.kind === "question" && item.canonicalId) {
      patch.question_id = item.canonicalId;
      if (item.family) patch.family = item.family;
      if (item.routeId) patch.route_id = item.routeId;
    }

    if (item.kind === "thesis" && item.canonicalId) {
      patch.thesis_id = item.canonicalId;
      if (item.family) patch.family = item.family;
      if (item.routeId) patch.route_id = item.routeId;
      if (item.level && item.level !== "unlevelled") patch.thesis_level = item.level;
    }
  });

  if (selectedQuoteIds.length !== plan.selected_quote_ids.length) {
    patch.selected_quote_ids = selectedQuoteIds;
  }

  return patch;
}

export function removeBuilderHandoff(items: BuilderHandoffItem[] | undefined, id: string): BuilderHandoffItem[] {
  return (items ?? []).filter((item) => item.id !== id);
}

export function handoffFromQuote(quote: LibraryQuote): BuilderHandoffItem {
  return {
    id: `quote:${quote.id}`,
    kind: "quote",
    originModule: "quotes",
    label: "Quote",
    title: quote.quoteText,
    text: quote.method || quote.effect || "Quote selected for evidence.",
    canonicalId: quote.id,
    sourceText: quote.sourceText,
    family: quote.themes[0],
    level: quote.level,
    metadata: {
      themes: quote.themes,
      method: quote.method,
      linkedMotifs: quote.linkedMotifs,
      linkedContext: quote.linkedContext,
      openingStems: quote.openingStems,
      aoPriority: quote.aoPriority,
      bestUsedFor: quote.bestUsedFor,
    },
  };
}

export function handoffFromQuestion(question: LibraryQuestion): BuilderHandoffItem {
  return {
    id: `question:${question.id}`,
    kind: "question",
    originModule: "questions",
    label: "Question",
    title: question.familyLabel,
    text: question.stem,
    canonicalId: question.id,
    family: question.family,
    routeId: question.primaryRoute?.id,
    routeLabel: question.primaryRoute?.name,
    level: question.level,
  };
}

export function handoffFromContext(item: LibraryContextItem): BuilderHandoffItem {
  return {
    id: `context:${item.kind}:${item.id}`,
    kind: "context",
    originModule: "context",
    label: "Context",
    title: item.title,
    text: item.summary,
    canonicalId: item.id,
    sourceText: item.sourceText,
    family: item.themes[0],
    level: item.level,
    metadata: {
      kind: item.kind,
      themes: item.themes,
    },
  };
}

export function handoffFromThesis(thesis: LibraryThesis): BuilderHandoffItem {
  return {
    id: `thesis:${thesis.id}`,
    kind: "thesis",
    originModule: "thesis",
    label: "Thesis",
    title: thesis.familyLabel,
    text: thesis.thesisText,
    canonicalId: thesis.id,
    family: thesis.family,
    routeId: thesis.route?.id,
    routeLabel: thesis.route?.name,
    level: thesis.level,
    metadata: {
      paragraphLabels: thesis.paragraphLabels,
    },
  };
}

export function handoffFromParagraphFrame(frame: LibraryParagraphFrame): BuilderHandoffItem {
  return {
    id: `paragraph_frame:${frame.id}`,
    kind: "paragraph_frame",
    originModule: "thesis",
    label: "Paragraph frame",
    title: frame.title,
    text: frame.judgementPrompt,
    canonicalId: frame.id,
    family: frame.family,
    routeId: frame.route?.id,
    routeLabel: frame.route?.name,
    metadata: {
      hardTimesPrompt: frame.hardTimesPrompt,
      atonementPrompt: frame.atonementPrompt,
      divergencePrompt: frame.divergencePrompt,
    },
  };
}

export function handoffFromComparison(pairing: LibraryComparativePairing): BuilderHandoffItem {
  return {
    id: `comparison:${pairing.id}`,
    kind: "comparison",
    originModule: "comparison",
    label: "Comparison",
    title: pairing.title,
    text: pairing.comparativeTension,
    canonicalId: pairing.id,
    family: pairing.themes[0],
    metadata: {
      hardTimesIdea: pairing.hardTimesIdea,
      atonementIdea: pairing.atonementIdea,
      themes: pairing.themes,
    },
  };
}
