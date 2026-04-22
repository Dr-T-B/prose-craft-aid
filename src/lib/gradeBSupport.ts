import { getLibraryThemeLabel, type LibraryParagraphFrame, type LibraryQuote } from "@/lib/libraryAdapters";
import type { BuilderHandoffItem } from "@/lib/builderHandoff";

export interface GradeBSupportBlock {
  label: string;
  items: string[];
}

function compact(items: Array<string | undefined | null>): string[] {
  return items
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function available(items: Array<string | undefined | null>): string[] {
  return compact(items).filter((item) => !/^No .+ available\.$/.test(item));
}

function metadataList(item: BuilderHandoffItem, key: string): string[] {
  const value = item.metadata?.[key];
  if (Array.isArray(value)) return compact(value);
  return compact([value]);
}

export function getQuoteGradeBSupport(quote: LibraryQuote): GradeBSupportBlock[] {
  const blocks: GradeBSupportBlock[] = [];
  const whyItMatters = compact([quote.plainEnglishMeaning, quote.meaning, quote.effect]).slice(0, 2);

  if (whyItMatters.length > 0) blocks.push({ label: "Why it matters", items: whyItMatters });
  if (quote.themes.length > 0) blocks.push({ label: "Themes to link", items: quote.themes.map(getLibraryThemeLabel) });
  if (quote.linkedMotifs.length > 0) blocks.push({ label: "Motifs / symbols", items: quote.linkedMotifs });
  if (quote.method) blocks.push({ label: "Method to name", items: [quote.method] });
  if (quote.linkedContext.length > 0) blocks.push({ label: "Context link", items: quote.linkedContext });
  if (quote.openingStems.length > 0) blocks.push({ label: "Starter stems", items: quote.openingStems.slice(0, 2) });
  if (quote.bestUsedFor.length > 0) blocks.push({ label: "Best used for", items: quote.bestUsedFor });

  return blocks;
}

export function getParagraphFrameStarter(frame: LibraryParagraphFrame): GradeBSupportBlock[] {
  return [
    { label: "Start with", items: available([frame.hardTimesPrompt, frame.atonementPrompt]).slice(0, 2) },
    { label: "Then compare", items: available([frame.divergencePrompt]) },
    { label: "Finish the point", items: available([frame.judgementPrompt]) },
  ].filter((block) => block.items.length > 0);
}

export function getHandoffGradeBHints(item: BuilderHandoffItem): string[] {
  if (item.kind === "quote") {
    const hints = [
      ...metadataList(item, "aoPriority").map((ao) => `${ao}: use this quote when that assessment objective is relevant.`),
      ...metadataList(item, "method").map((method) => `Name the method: ${method}`),
      ...metadataList(item, "openingStems").slice(0, 1).map((stem) => `Paragraph starter: ${stem}`),
      ...metadataList(item, "linkedContext").slice(0, 1).map((context) => `Context link: ${context}`),
    ];
    return hints.slice(0, 3);
  }

  if (item.kind === "paragraph_frame") {
    return compact([
      item.metadata?.hardTimesPrompt as string | undefined,
      item.metadata?.atonementPrompt as string | undefined,
      item.metadata?.divergencePrompt as string | undefined,
    ]).slice(0, 2);
  }

  if (item.kind === "thesis") {
    return metadataList(item, "paragraphLabels").slice(0, 2).map((label) => `Build a paragraph around: ${label}`);
  }

  if (item.kind === "context") return ["Use this as an AO3 support note where it genuinely explains meaning."];
  if (item.kind === "comparison") return ["Use this to sharpen AO4: name the similarity or tension before evidence."];
  if (item.kind === "question") return compact([item.routeLabel]).map((route) => `Start planning through this route: ${route}`);

  return [];
}
