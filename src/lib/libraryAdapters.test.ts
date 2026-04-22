import { describe, expect, it } from "vitest";
import {
  comparativePairingMatchesText,
  contextMatchesText,
  groupLibraryQuotesByTheme,
  libraryContextKindSupportsSourceFilter,
  questionMatchesText,
  quoteMatchesText,
  toLibraryContextFromAO5,
  toLibraryContextFromCharacters,
  toLibraryContextFromSymbols,
  toLibraryContextFromThemes,
  toLibraryComparativePairings,
  thesisMatchesText,
  toLibraryParagraphFrames,
  toLibraryQuestions,
  toLibraryTheses,
  toLibraryQuotes,
} from "./libraryAdapters";
import { getAppMode } from "@/components/AppShell";

describe("library quote adapters", () => {
  it("normalises partial quote rows without throwing", () => {
    const [quote] = toLibraryQuotes([{ id: "q1", quote_text: "a remembered phrase" }]);

    expect(quote.sourceText).toBe("Unknown");
    expect(quote.quoteText).toBe("a remembered phrase");
    expect(quote.themes).toEqual([]);
    expect(quote.method).toBe("");
  });

  it("groups quotes by theme and de-duplicates the grouped counter", () => {
    const quotes = toLibraryQuotes([
      { id: "q1", quote_text: "one", best_themes: ["class", "power"] },
      { id: "q2", quote_text: "two", best_themes: ["class"] },
      { id: "q3", quote_text: "three" },
    ]);

    const grouped = groupLibraryQuotesByTheme(quotes);

    expect(grouped.groups.find((group) => group.family === "class")?.quotes).toHaveLength(2);
    expect(grouped.groups.find((group) => group.family === "power")?.quotes).toHaveLength(1);
    expect(grouped.untagged).toHaveLength(1);
    expect(grouped.uniqueCount).toBe(3);
  });

  it("keeps empty and sparse grouped quote input stable", () => {
    expect(groupLibraryQuotesByTheme([])).toEqual({
      groups: [],
      untagged: [],
      uniqueCount: 0,
    });

    const sparse = groupLibraryQuotesByTheme(toLibraryQuotes([{ id: "q1" }]));

    expect(sparse.groups).toEqual([]);
    expect(sparse.untagged).toHaveLength(1);
    expect(sparse.uniqueCount).toBe(1);
  });

  it("searches quote text and supporting metadata", () => {
    const [quote] = toLibraryQuotes([
      {
        id: "q1",
        quote_text: "Facts alone are wanted in life",
        method: "imperative opening",
        linked_context: ["Utilitarian education"],
      },
    ]);

    expect(quoteMatchesText(quote, "utilitarian")).toBe(true);
    expect(quoteMatchesText(quote, "metaphor")).toBe(false);
  });

  it("searches richer useful metadata fields", () => {
    const [quote] = toLibraryQuotes([
      {
        id: "q1",
        quote_text: "Something happened",
        speaker_or_narrator: "Briony",
        location_reference: "library scene",
        linked_motifs: ["writing"],
        linked_interpretations: ["narrative control"],
        best_used_for: ["unreliable narration"],
      },
    ]);

    expect(quoteMatchesText(quote, "library scene")).toBe(true);
    expect(quoteMatchesText(quote, "unreliable")).toBe(true);
    expect(quoteMatchesText(quote, "narrative control")).toBe(true);
  });

  it("classifies Explore mode only for library routes", () => {
    expect(getAppMode("/library")).toBe("explore");
    expect(getAppMode("/library/quotes")).toBe("explore");
    expect(getAppMode("/compare")).toBe("build");
    expect(getAppMode("/learn")).toBe("build");
    expect(getAppMode("/builder")).toBe("build");
  });
});

describe("library question adapters", () => {
  it("normalises questions with route references", () => {
    const [question] = toLibraryQuestions(
      [
        {
          id: "q1",
          family: "class",
          stem: "Compare class in both novels.",
          primary_route_id: "r_class",
          secondary_route_id: "r_systems",
          likely_core_methods: ["dialect"],
          level_tag: "strong",
        },
      ],
      [
        { id: "r_class", name: "Class as mechanism", core_question: "How does class decide who is believed?" },
        { id: "r_systems", name: "Systems shaping behaviour" },
      ],
    );

    expect(question.familyLabel).toBe("Class");
    expect(question.primaryRoute?.name).toBe("Class as mechanism");
    expect(question.secondaryRoute?.name).toBe("Systems shaping behaviour");
    expect(question.likelyMethods).toEqual(["dialect"]);
  });

  it("exposes library-facing question records without raw runtime field names", () => {
    const [question] = toLibraryQuestions([{ id: "q1", family: "class", primary_route_id: "r1" }], [{ id: "r1", name: "Route" }]);
    const keys = Object.keys(question);

    expect(keys).toContain("familyLabel");
    expect(keys).toContain("likelyMethods");
    expect(keys).not.toContain("level_tag");
    expect(keys).not.toContain("primary_route_id");
    expect(keys).not.toContain("likely_core_methods");
  });

  it("keeps empty and sparse question input stable", () => {
    expect(toLibraryQuestions(undefined)).toEqual([]);

    const [question] = toLibraryQuestions([{ id: "q_sparse" }]);

    expect(question.stem).toBe("Question stem unavailable");
    expect(question.level).toBe("unlevelled");
    expect(question.likelyMethods).toEqual([]);
  });

  it("searches question stems, families, routes, and methods", () => {
    const [question] = toLibraryQuestions(
      [
        {
          id: "q1",
          family: "truth",
          stem: "Compare the difficulty of telling the truth.",
          primary_route_id: "r_story",
          likely_core_methods: ["metafiction"],
        },
      ],
      [{ id: "r_story", name: "Storytelling and truth", core_question: "Can fiction tell the truth?" }],
    );

    expect(questionMatchesText(question, "metafiction")).toBe(true);
    expect(questionMatchesText(question, "storytelling")).toBe(true);
    expect(questionMatchesText(question, "industrial")).toBe(false);
  });
});

describe("library context adapters", () => {
  it("normalises context entries from the current runtime collections", () => {
    const [character] = toLibraryContextFromCharacters([
      {
        id: "c1",
        source_text: "Hard Times",
        name: "Louisa",
        one_line: "Raised on Fact.",
        themes: ["childhood", "gender"],
        core_function: "Shows the cost of Utilitarian education.",
      },
    ]);
    const [symbol] = toLibraryContextFromSymbols([{ id: "s1", source_text: "Atonement", name: "The vase", themes: ["guilt"] }]);
    const [theme] = toLibraryContextFromThemes([{ family: "power", one_line: "Institutional pressure." }]);
    const [ao5] = toLibraryContextFromAO5([{ focus: "Fiction", dominant_reading: "Repair", best_use: ["truth"], level_tag: "top_band" }]);

    expect(character.kind).toBe("character");
    expect(character.details[0]).toEqual({ label: "Core function", value: "Shows the cost of Utilitarian education." });
    expect(symbol.summary).toBe("No contextual summary available.");
    expect(theme.title).toBe("Power");
    expect(ao5.sourceText).toBe("Comparative");
    expect(ao5.level).toBe("top_band");
  });

  it("exposes source filtering only for context kinds with text-specific sources", () => {
    expect(libraryContextKindSupportsSourceFilter("character")).toBe(true);
    expect(libraryContextKindSupportsSourceFilter("symbol")).toBe(true);
    expect(libraryContextKindSupportsSourceFilter("theme")).toBe(false);
    expect(libraryContextKindSupportsSourceFilter("ao5")).toBe(false);
  });

  it("keeps empty and sparse context input stable", () => {
    expect(toLibraryContextFromCharacters(undefined)).toEqual([]);

    const [entry] = toLibraryContextFromAO5([{ id: "a_sparse" }]);

    expect(entry.title).toBe("Unnamed AO5 tension");
    expect(entry.summary).toBe("No AO5 stem available.");
    expect(entry.themes).toEqual([]);
  });

  it("searches context titles, summaries, themes, and details", () => {
    const [entry] = toLibraryContextFromCharacters([
      {
        id: "c1",
        source_text: "Atonement",
        name: "Briony Tallis",
        one_line: "Author of the wrong.",
        themes: ["narrative_authority"],
        common_misreading: "Treating atonement as achieved.",
      },
    ]);

    expect(contextMatchesText(entry, "narrative authority")).toBe(true);
    expect(contextMatchesText(entry, "achieved")).toBe(true);
    expect(contextMatchesText(entry, "coketown")).toBe(false);
  });
});

describe("library thesis and paragraph adapters", () => {
  it("normalises theses with route references and matching paragraph frames", () => {
    const [thesis] = toLibraryTheses(
      [
        {
          id: "th1",
          route_id: "r_truth",
          theme_family: "truth",
          level: "top_band",
          thesis_text: "Both novels test whether fiction can tell the truth.",
          paragraph_job_1_label: "Narrative confidence",
          paragraph_job_2_label: "Narrative suspicion",
        },
      ],
      [{ id: "r_truth", name: "Storytelling and truth", core_question: "Can fiction tell the truth?" }],
      [
        {
          id: "pj1",
          route_id: "r_truth",
          question_family: "truth",
          job_title: "Truth claim",
          text1_prompt: "Track Dickens's narrator.",
          text2_prompt: "Track Briony's narration.",
          divergence_prompt: "Compare confidence and suspicion.",
          judgement_prompt: "Return to the question of truth.",
        },
      ],
    );

    expect(thesis.familyLabel).toBe("Truth & Storytelling");
    expect(thesis.route?.name).toBe("Storytelling and truth");
    expect(thesis.paragraphLabels).toEqual(["Narrative confidence", "Narrative suspicion"]);
    expect(thesis.paragraphFrames).toHaveLength(1);
    expect(thesis.paragraphFrames[0].hardTimesPrompt).toBe("Track Dickens's narrator.");
  });

  it("normalises standalone paragraph frames", () => {
    const [frame] = toLibraryParagraphFrames([
      {
        id: "pj1",
        route_id: "r1",
        question_family: "class",
        job_title: "Class voice",
        text1_prompt: "Stephen's exclusion.",
      },
    ]);

    expect(frame.familyLabel).toBe("Class");
    expect(frame.title).toBe("Class voice");
    expect(frame.atonementPrompt).toBe("No Atonement prompt available.");
  });

  it("keeps empty and sparse thesis input stable", () => {
    expect(toLibraryTheses(undefined)).toEqual([]);

    const [thesis] = toLibraryTheses([{ id: "th_sparse" }]);

    expect(thesis.thesisText).toBe("Thesis text unavailable.");
    expect(thesis.level).toBe("unlevelled");
    expect(thesis.paragraphLabels).toEqual([]);
    expect(thesis.paragraphFrames).toEqual([]);
  });

  it("searches thesis text, labels, routes, and paragraph frame prompts", () => {
    const [thesis] = toLibraryTheses(
      [
        {
          id: "th1",
          route_id: "r1",
          theme_family: "guilt",
          thesis_text: "Guilt becomes permanent labour.",
          paragraph_job_1_label: "Recognition",
        },
      ],
      [{ id: "r1", name: "Guilt and repair", core_question: "Can wrongs be repaired?" }],
      [{ id: "pj1", route_id: "r1", question_family: "guilt", job_title: "Atonement attempt", judgement_prompt: "The attempt matters." }],
    );

    expect(thesisMatchesText(thesis, "repair")).toBe(true);
    expect(thesisMatchesText(thesis, "recognition")).toBe(true);
    expect(thesisMatchesText(thesis, "attempt matters")).toBe(true);
    expect(thesisMatchesText(thesis, "industrial smoke")).toBe(false);
  });
});

describe("library comparative pairing adapters", () => {
  it("normalises comparative matrix rows into comparison-ready pairings", () => {
    const [pairing] = toLibraryComparativePairings([
      {
        id: "cmx_class",
        axis: "Class and voice",
        hard_times: "Stephen's dialect marks exclusion.",
        atonement: "Robbie is pre-read by class.",
        divergence: "Dickens externalises class; McEwan internalises it.",
        themes: ["class", "power"],
      },
    ]);

    expect(pairing.title).toBe("Class and voice");
    expect(pairing.hardTimesIdea).toBe("Stephen's dialect marks exclusion.");
    expect(pairing.atonementIdea).toBe("Robbie is pre-read by class.");
    expect(pairing.comparativeTension).toBe("Dickens externalises class; McEwan internalises it.");
    expect(pairing.themes).toEqual(["class", "power"]);
  });

  it("keeps empty and sparse comparative input stable", () => {
    expect(toLibraryComparativePairings(undefined)).toEqual([]);

    const [pairing] = toLibraryComparativePairings([{ id: "cmx_sparse" }]);

    expect(pairing.title).toBe("Untitled comparative axis");
    expect(pairing.hardTimesIdea).toBe("No Hard Times comparison note available.");
    expect(pairing.atonementIdea).toBe("No Atonement comparison note available.");
    expect(pairing.comparativeTension).toBe("No comparative tension note available.");
    expect(pairing.themes).toEqual([]);
  });

  it("searches comparative titles, text-specific notes, tensions, and theme labels", () => {
    const [pairing] = toLibraryComparativePairings([
      {
        id: "cmx_truth",
        axis: "Narrative authority",
        hard_times: "Dickens's narrator delivers verdicts.",
        atonement: "Briony exposes the right to tell.",
        divergence: "Authority claimed versus authority interrogated.",
        themes: ["narrative_authority", "truth"],
      },
    ]);

    expect(comparativePairingMatchesText(pairing, "authority")).toBe(true);
    expect(comparativePairingMatchesText(pairing, "briony")).toBe(true);
    expect(comparativePairingMatchesText(pairing, "truth & storytelling")).toBe(true);
    expect(comparativePairingMatchesText(pairing, "industrial smoke")).toBe(false);
  });
});
