import { describe, expect, it } from "vitest";
import { getHandoffGradeBHints, getParagraphFrameStarter, getQuoteGradeBSupport } from "./gradeBSupport";
import type { BuilderHandoffItem } from "./builderHandoff";
import type { LibraryParagraphFrame, LibraryQuote } from "./libraryAdapters";

describe("grade B support helpers", () => {
  it("derives quote support only from existing quote fields", () => {
    const quote: LibraryQuote = {
      id: "q1",
      sourceText: "Hard Times",
      quoteText: "Facts alone are wanted in life",
      method: "imperative",
      themes: ["class", "power"],
      effect: "Establishes Gradgrind's control.",
      meaning: "",
      level: "secure",
      plainEnglishMeaning: "Education is narrowed to measurable fact.",
      linkedMotifs: ["facts"],
      linkedContext: ["utilitarian schooling"],
      linkedInterpretations: [],
      openingStems: ["Dickens presents education as..."],
      comparativePrompts: [],
      isCoreQuote: true,
      aoPriority: ["AO2", "AO3"],
      bestUsedFor: ["education and power"],
    };

    const labels = getQuoteGradeBSupport(quote).map((block) => block.label);

    expect(labels).toEqual([
      "Why it matters",
      "Themes to link",
      "Motifs / symbols",
      "Method to name",
      "Context link",
      "Starter stems",
      "Best used for",
    ]);
  });

  it("handles sparse quote support without fabricating links", () => {
    const quote: LibraryQuote = {
      id: "q1",
      sourceText: "Unknown",
      quoteText: "Unavailable",
      method: "",
      themes: [],
      effect: "",
      meaning: "",
      level: "unlevelled",
      linkedMotifs: [],
      linkedContext: [],
      linkedInterpretations: [],
      openingStems: [],
      comparativePrompts: [],
      isCoreQuote: false,
      aoPriority: [],
      bestUsedFor: [],
    };

    expect(getQuoteGradeBSupport(quote)).toEqual([]);
  });

  it("turns paragraph frame prompts into starter blocks", () => {
    const frame: LibraryParagraphFrame = {
      id: "pf1",
      family: "truth",
      familyLabel: "Truth & Storytelling",
      title: "Narrative control",
      hardTimesPrompt: "Open with Dickens' narrator.",
      atonementPrompt: "Then move to Briony.",
      divergencePrompt: "Contrast certainty with uncertainty.",
      judgementPrompt: "Judge why that contrast matters.",
    };

    expect(getParagraphFrameStarter(frame).map((block) => block.label)).toEqual([
      "Start with",
      "Then compare",
      "Finish the point",
    ]);
  });

  it("does not present unavailable paragraph prompt fallbacks as starters", () => {
    const frame: LibraryParagraphFrame = {
      id: "pf_sparse",
      family: "truth",
      familyLabel: "Truth & Storytelling",
      title: "Sparse frame",
      hardTimesPrompt: "No Hard Times prompt available.",
      atonementPrompt: "  Use Briony's narrative control. ",
      divergencePrompt: "No divergence prompt available.",
      judgementPrompt: "No judgement prompt available.",
    };

    expect(getParagraphFrameStarter(frame)).toEqual([
      { label: "Start with", items: ["Use Briony's narrative control."] },
    ]);
  });

  it("derives Builder intake hints from handoff metadata", () => {
    const item: BuilderHandoffItem = {
      id: "quote:q1",
      kind: "quote",
      originModule: "quotes",
      label: "Quote",
      title: "Facts",
      text: "imperative",
      metadata: {
        method: "imperative",
        aoPriority: ["AO2"],
        openingStems: ["Dickens begins by..."],
      },
    };

    expect(getHandoffGradeBHints(item)).toEqual([
      "AO2: use this quote when that assessment objective is relevant.",
      "Name the method: imperative",
      "Paragraph starter: Dickens begins by...",
    ]);
  });
});
