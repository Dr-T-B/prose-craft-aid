import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeQueuedBuilderHandoffs,
  handoffFromComparison,
  handoffFromQuestion,
  handoffFromQuote,
  integrateBuilderHandoffsIntoCurrentPlan,
  mergeBuilderHandoffsIntoPlan,
  queueBuilderHandoff,
  removeBuilderHandoff,
} from "./builderHandoff";
import type { LibraryComparativePairing, LibraryQuestion, LibraryQuote } from "./libraryAdapters";
import { getCurrentPlan, setCurrentPlan } from "./planStore";

describe("builder handoff helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates lightweight quote payloads without raw runtime field names", () => {
    const quote: LibraryQuote = {
      id: "qm1",
      sourceText: "Hard Times",
      quoteText: "Facts alone are wanted in life",
      method: "imperative opening",
      themes: ["class"],
      effect: "Controls the classroom.",
      meaning: "",
      level: "strong",
      linkedMotifs: [],
      linkedContext: [],
      linkedInterpretations: [],
      openingStems: [],
      comparativePrompts: [],
      isCoreQuote: false,
      aoPriority: [],
      bestUsedFor: [],
    };

    const item = handoffFromQuote(quote);

    expect(item).toMatchObject({
      id: "quote:qm1",
      kind: "quote",
      originModule: "quotes",
      label: "Quote",
      canonicalId: "qm1",
      sourceText: "Hard Times",
      family: "class",
    });
    expect(Object.keys(item)).not.toContain("quote_text");
    expect(Object.keys(item)).not.toContain("source_text");
  });

  it("creates question payloads with builder-relevant route metadata", () => {
    const question: LibraryQuestion = {
      id: "q1",
      family: "truth",
      familyLabel: "Truth & Storytelling",
      stem: "Compare truth in both novels.",
      level: "top_band",
      likelyMethods: [],
      primaryRoute: { id: "r_truth", name: "Storytelling and truth" },
    };

    expect(handoffFromQuestion(question)).toMatchObject({
      id: "question:q1",
      kind: "question",
      canonicalId: "q1",
      family: "truth",
      routeId: "r_truth",
      routeLabel: "Storytelling and truth",
    });
  });

  it("creates comparison payloads as AO4 planning notes", () => {
    const pairing: LibraryComparativePairing = {
      id: "cmx1",
      title: "Narrative authority",
      hardTimesIdea: "Dickens claims authority.",
      atonementIdea: "McEwan interrogates authority.",
      comparativeTension: "Authority claimed versus authority questioned.",
      themes: ["narrative_authority"],
    };

    const item = handoffFromComparison(pairing);

    expect(item.kind).toBe("comparison");
    expect(item.text).toBe("Authority claimed versus authority questioned.");
    expect(item.metadata?.hardTimesIdea).toBe("Dickens claims authority.");
  });

  it("merges handoffs into a plan and applies direct builder fields where possible", () => {
    const question = {
      id: "question:q1",
      kind: "question" as const,
      originModule: "questions" as const,
      label: "Question",
      title: "Truth",
      text: "Compare truth.",
      canonicalId: "q1",
      family: "truth" as const,
      routeId: "r_truth",
    };
    const quote = {
      id: "quote:qm1",
      kind: "quote" as const,
      originModule: "quotes" as const,
      label: "Quote",
      title: "Facts",
      text: "imperative",
      canonicalId: "qm1",
    };

    const patch = mergeBuilderHandoffsIntoPlan(
      { selected_quote_ids: [], builder_handoffs: [] },
      [question, quote],
    );

    expect(patch.question_id).toBe("q1");
    expect(patch.family).toBe("truth");
    expect(patch.route_id).toBe("r_truth");
    expect(patch.selected_quote_ids).toEqual(["qm1"]);
    expect(patch.builder_handoffs).toHaveLength(2);
  });

  it("deduplicates handoffs and supports removal", () => {
    const item = {
      id: "comparison:cmx1",
      kind: "comparison" as const,
      originModule: "comparison" as const,
      label: "Comparison",
      title: "Narrative authority",
      text: "Authority tension.",
    };

    const patch = mergeBuilderHandoffsIntoPlan(
      { selected_quote_ids: [], builder_handoffs: [item] },
      [item],
    );

    expect(patch.builder_handoffs).toEqual([item]);
    expect(removeBuilderHandoff(patch.builder_handoffs, item.id)).toEqual([]);
  });

  it("writes Explore handoffs directly into the current plan", () => {
    const item = {
      id: "quote:qm1",
      kind: "quote" as const,
      originModule: "quotes" as const,
      label: "Quote",
      title: "Facts",
      text: "imperative",
      canonicalId: "qm1",
    };

    queueBuilderHandoff(item);

    const plan = getCurrentPlan();
    expect(plan.builder_handoffs).toEqual([item]);
    expect(plan.selected_quote_ids).toEqual(["qm1"]);
    expect(consumeQueuedBuilderHandoffs()).toEqual([]);
  });

  it("preserves and deduplicates current-plan intake on repeated imports", () => {
    const question = {
      id: "question:q1",
      kind: "question" as const,
      originModule: "questions" as const,
      label: "Question",
      title: "Truth",
      text: "Compare truth.",
      canonicalId: "q1",
      family: "truth" as const,
      routeId: "r_truth",
    };
    const quote = {
      id: "quote:qm1",
      kind: "quote" as const,
      originModule: "quotes" as const,
      label: "Quote",
      title: "Facts",
      text: "imperative",
      canonicalId: "qm1",
    };

    setCurrentPlan({
      ...getCurrentPlan(),
      selected_quote_ids: ["qm1"],
      builder_handoffs: [quote],
    });

    const next = integrateBuilderHandoffsIntoCurrentPlan([quote, question]);

    expect(next.builder_handoffs).toEqual([quote, question]);
    expect(next.selected_quote_ids).toEqual(["qm1"]);
    expect(next.question_id).toBe("q1");
    expect(next.route_id).toBe("r_truth");
    expect(next.family).toBe("truth");
  });
});
