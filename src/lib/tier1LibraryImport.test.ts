import { describe, expect, it } from "vitest";
import {
  isTier1LibraryTarget,
  normalizeTier1LibraryRow,
  prepareTier1LibraryRows,
  validateTier1LibraryRow,
} from "./tier1LibraryImport";

describe("tier 1 library import utilities", () => {
  it("normalizes and prepares a valid library_quotes row", () => {
    const report = prepareTier1LibraryRows("library_quotes", [
      {
        Quote: "  It was the best of times  ",
        Source: "Hard Times",
        Character: "Gradgrind",
        Themes: "education, fact | Childhood; education",
        AO: "AO2; AO3",
        Difficulty: "strong",
        Analysis: "Useful for utilitarian thinking.",
        Notes: "Core quote.",
        "Spreadsheet Only": "keep me",
      },
    ], { sourceDataset: "tier1", sourceSheet: "Quotes" });

    expect(report.rows_valid).toBe(1);
    expect(report.rows_invalid).toBe(0);
    expect(report.preparedRows[0].normalizedPayload.quote_text).toBe("It was the best of times");
    expect(report.preparedRows[0].normalizedPayload.theme_tags).toEqual(["education", "fact", "Childhood"]);
    expect(report.preparedRows[0].normalizedPayload.metadata).toEqual({
      unmapped_source_fields: {
        "Spreadsheet Only": "keep me",
      },
    });
    expect(report.preparedRows[0].contentHash).toMatch(/^t1_/);
    expect(report.preparedRows[0].dedupeKey).toBe(`library_quotes:${report.preparedRows[0].contentHash}`);
  });

  it("marks a library_quotes row invalid when quote_text is missing", () => {
    const report = prepareTier1LibraryRows("library_quotes", [
      {
        Source: "Hard Times",
        Themes: "class",
      },
    ]);

    expect(report.rows_invalid).toBe(1);
    expect(report.invalidRows[0].validationErrors.map((error) => error.field)).toContain("quote_text");
  });

  it("normalizes a valid library_context_bank row", () => {
    const normalized = normalizeTier1LibraryRow("library_context_bank", {
      Title: "Industrial context",
      Context: "Factories shape the moral atmosphere of Coketown.",
      Source: "Hard Times",
      ao3_link: "AO3, Context",
      quote_refs: "facts; smoke | hands",
    });
    const validation = validateTier1LibraryRow("library_context_bank", normalized);

    expect(validation.status).toBe("warning");
    expect(normalized.context_point).toBe("Factories shape the moral atmosphere of Coketown.");
    expect(normalized.ao_tags).toEqual(["AO3", "Context"]);
    expect(normalized.linked_quote_refs).toEqual(["facts", "smoke", "hands"]);
  });

  it("normalizes a valid library_paragraph_frames row", () => {
    const report = prepareTier1LibraryRows("library_paragraph_frames", [
      {
        "paragraph frame": "Dickens presents this idea through...",
        "grade band": "top",
        "use case": "AO2 comparison",
        themes: "class; power",
        aos: "AO1|AO2",
      },
    ]);

    expect(report.rows_warning).toBe(1);
    expect(report.preparedRows[0].normalizedPayload.frame_text).toBe("Dickens presents this idea through...");
    expect(report.preparedRows[0].normalizedPayload.theme_tags).toEqual(["class", "power"]);
  });

  it("keeps content_hash stable for equivalent canonical content", () => {
    const first = prepareTier1LibraryRows("library_quotes", [
      {
        quote: " Facts alone are wanted in life. ",
        source: "Hard Times",
        speaker: "Gradgrind",
        analysis: "x",
        notes: "x",
        themes: "education",
        ao: "AO2",
        difficulty: "secure",
      },
    ]);
    const second = prepareTier1LibraryRows("library_quotes", [
      {
        quote_text: "facts alone are wanted in life.",
        source_text: " hard times ",
        speaker: " gradgrind ",
        analysis: "x",
        notes: "x",
        theme_tags: "education",
        ao_tags: "AO2",
        difficulty_level: "secure",
      },
    ]);

    expect(first.preparedRows[0].contentHash).toBe(second.preparedRows[0].contentHash);
  });

  it("rejects unknown targets", () => {
    expect(isTier1LibraryTarget("library_quotes")).toBe(true);
    const report = prepareTier1LibraryRows("not_a_table", [{ quote: "x" }]);
    expect(report.rows_invalid).toBe(1);
    expect(report.errors[0].message).toContain("Unknown target table");
  });
});
