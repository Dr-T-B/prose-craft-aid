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

/** Fetch the full content bundle from Supabase, falling back to local seed
 *  if any table errors or returns empty. Never throws. */
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("glossary_terms").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        (supabase as any).from("paragraph_stems").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("modules").select("*").eq("published", true).order("position", { ascending: true }),
        supabase.from("lessons").select("*").eq("published", true).order("position", { ascending: true }),
        supabase.from("resources").select("*").eq("published", true).order("position", { ascending: true }),
      ]);

    const ok =
      !routes.error && (routes.data?.length ?? 0) > 0 &&
      !questions.error && (questions.data?.length ?? 0) > 0 &&
      !theses.error && (theses.data?.length ?? 0) > 0;

    if (!ok) return LOCAL_BUNDLE;

    // De-duplicate by id so accidental import duplicates never double-render.
    const dedupe = <T extends { id: string }>(arr: unknown[]): T[] => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const row of arr as T[]) {
        if (row && row.id && !seen.has(row.id)) { seen.add(row.id); out.push(row); }
      }
      return out;
    };

    return {
      routes: dedupe<Route>(routes.data ?? []),
      questions: dedupe<Question>(questions.data ?? []),
      theses: dedupe<Thesis>(theses.data ?? []),
      paragraph_jobs: dedupe<ParagraphJob>(jobs.data ?? []),
      quote_methods: dedupe<QuoteMethod>(quotes.data ?? []),
      ao5_tensions: dedupe<AO5Tension>(ao5.data ?? []),
      characters: dedupe<CharacterEntry>(chars.data ?? []),
      themes: dedupe<ThemeEntry>(themes.data ?? []),
      symbols: dedupe<SymbolEntry>(symbols.data ?? []),
      comparative_matrix: dedupe<ComparativeMatrixEntry>(matrix.data ?? []),
      glossary_terms: dedupe<GlossaryTerm>(glossary.data ?? []),
      paragraph_stems: dedupe<ParagraphStem>(stems.data ?? []),
      modules: dedupe<Module>(modules.data ?? []),
      lessons: dedupe<Lesson>(lessons.data ?? []),
      resources: dedupe<Resource>(resources.data ?? []),
      source: "remote",
    };
  } catch {
    return LOCAL_BUNDLE;
  }
}

export const localContentBundle = LOCAL_BUNDLE;
