// Content repository — read-from-Supabase with safe fallback to local seed.
//
// Stage-4 entry point. Pages can opt in to remote content gradually via
// `loadContent()`; if the fetch fails or returns empty, the existing
// local seed is used so the MVP keeps working under all conditions.

import { supabase } from "@/integrations/supabase/client";
import {
  ROUTES as SEED_ROUTES,
  QUESTIONS as SEED_QUESTIONS,
  THESES as SEED_THESES,
  PARAGRAPH_JOBS as SEED_PARAGRAPH_JOBS,
  QUOTE_METHODS as SEED_QUOTE_METHODS,
  AO5_TENSIONS as SEED_AO5,
  CHARACTERS as SEED_CHARACTERS,
  THEMES as SEED_THEMES,
  SYMBOLS as SEED_SYMBOLS,
  COMPARATIVE_MATRIX as SEED_MATRIX,
  type Route, type Question, type Thesis, type ParagraphJob,
  type QuoteMethod, type AO5Tension, type CharacterEntry,
  type ThemeEntry, type SymbolEntry, type ComparativeMatrixEntry,
} from "@/data/seed";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  student_friendly_definition?: string | null;
  common_misuse_warning?: string | null;
  best_verbs?: string[] | null;
  sentence_stem?: string | null;
  level_band?: string | null;
}


export interface ParagraphStem {
  id: string;
  stem_text: string;
  ao: string[];
  function: string;
  text_focus: string | null;
  best_themes: string[];
  level_band: string;
  example_use: string | null;
  is_active: boolean;
  sort_order: number;
}
export interface Module {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  position: number;
  published: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  body?: string | null;
  position: number;
  published: boolean;
  estimated_minutes?: number | null;
}

export interface Resource {
  id: string;
  lesson_id?: string | null;
  module_id?: string | null;
  title: string;
  url: string;
  position: number;
  published: boolean;
}

export interface ContentBundle {
  routes: Route[];
  questions: Question[];
  theses: Thesis[];
  paragraph_jobs: ParagraphJob[];
  quote_methods: QuoteMethod[];
  ao5_tensions: AO5Tension[];
  characters: CharacterEntry[];
  themes: ThemeEntry[];
  symbols: SymbolEntry[];
  comparative_matrix: ComparativeMatrixEntry[];
  glossary_terms: GlossaryTerm[];
  paragraph_stems: ParagraphStem[];
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
  source: "remote" | "local";
}

const LOCAL_BUNDLE: ContentBundle = {
  routes: SEED_ROUTES,
  questions: SEED_QUESTIONS,
  theses: SEED_THESES,
  paragraph_jobs: SEED_PARAGRAPH_JOBS,
  quote_methods: SEED_QUOTE_METHODS,
  ao5_tensions: SEED_AO5,
  characters: SEED_CHARACTERS,
  themes: SEED_THEMES,
  symbols: SEED_SYMBOLS,
  comparative_matrix: SEED_MATRIX,
  glossary_terms: [],
  paragraph_stems: [],
  modules: [],
  lessons: [],
  resources: [],
  source: "local",
};

type ContentQueryResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

const dedupe = <T extends { id: string }>(arr: unknown[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of arr as T[]) {
    if (row && row.id && !seen.has(row.id)) {
      seen.add(row.id);
      out.push(row);
    }
  }
  return out;
};

const warnFallback = (dataset: string, reason: string) => {
  if (import.meta.env.DEV && import.meta.env.MODE !== "test") {
    console.warn(`[ProseCraft] Using local fallback for ${dataset}: ${reason}`);
  }
};

/** Fetch the full content bundle from Supabase, falling back per dataset.
 *  One empty or rejected table must not discard successful remote content from
 *  unrelated tables. Never throws. */
export async function loadContent(): Promise<ContentBundle> {
  try {
    const [routes, questions, theses, jobs, quotes, ao5, chars, themes, symbols, matrix, glossary, modules, lessons, resources, stems] =
      await Promise.all([
        supabase.from("routes").select("*"),
        supabase.from("questions").select("*").eq("is_active", true),
        supabase.from("theses").select("*"),
        supabase.from("paragraph_jobs").select("*"),
        supabase.from("quote_methods").select("*").eq("is_active", true),
        supabase.from("ao5_tensions").select("*"),
        supabase.from("character_cards").select("*"),
        supabase.from("theme_maps").select("*"),
        supabase.from("symbol_entries").select("*"),
        supabase.from("comparative_matrix").select("*"),
        (supabase as any).from("glossary_terms").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        (supabase as any).from("paragraph_stems").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("modules").select("*").eq("published", true).order("position", { ascending: true }),
        supabase.from("lessons").select("*").eq("published", true).order("position", { ascending: true }),
        supabase.from("resources").select("*").eq("published", true).order("position", { ascending: true }),
      ]);

    let usedRemote = false;

    const pick = <T extends { id: string }>(
      dataset: string,
      result: ContentQueryResult<T>,
      fallback: T[],
    ): T[] => {
      if (result.error) {
        warnFallback(dataset, result.error.message || "remote query failed");
        return fallback;
      }

      const remoteRows = dedupe<T>(result.data ?? []);
      if (remoteRows.length > 0) {
        usedRemote = true;
        return remoteRows;
      }

      if (fallback.length > 0) {
        warnFallback(dataset, "remote table returned no rows");
      }
      return fallback;
    };

    return {
      routes: pick<Route>("routes", routes, LOCAL_BUNDLE.routes),
      questions: pick<Question>("questions", questions, LOCAL_BUNDLE.questions),
      theses: pick<Thesis>("theses", theses, LOCAL_BUNDLE.theses),
      paragraph_jobs: pick<ParagraphJob>("paragraph_jobs", jobs, LOCAL_BUNDLE.paragraph_jobs),
      quote_methods: pick<QuoteMethod>("quote_methods", quotes, LOCAL_BUNDLE.quote_methods),
      ao5_tensions: pick<AO5Tension>("ao5_tensions", ao5, LOCAL_BUNDLE.ao5_tensions),
      characters: pick<CharacterEntry>("character_cards", chars, LOCAL_BUNDLE.characters),
      themes: pick<ThemeEntry>("theme_maps", themes, LOCAL_BUNDLE.themes),
      symbols: pick<SymbolEntry>("symbol_entries", symbols, LOCAL_BUNDLE.symbols),
      comparative_matrix: pick<ComparativeMatrixEntry>("comparative_matrix", matrix, LOCAL_BUNDLE.comparative_matrix),
      glossary_terms: pick<GlossaryTerm>("glossary_terms", glossary, LOCAL_BUNDLE.glossary_terms),
      paragraph_stems: pick<ParagraphStem>("paragraph_stems", stems, LOCAL_BUNDLE.paragraph_stems),
      modules: pick<Module>("modules", modules, LOCAL_BUNDLE.modules),
      lessons: pick<Lesson>("lessons", lessons, LOCAL_BUNDLE.lessons),
      resources: pick<Resource>("resources", resources, LOCAL_BUNDLE.resources),
      source: usedRemote ? "remote" : "local",
    };
  } catch (error) {
    warnFallback("content bundle", error instanceof Error ? error.message : "remote fetch failed");
    return LOCAL_BUNDLE;
  }
}

export const localContentBundle = LOCAL_BUNDLE;
