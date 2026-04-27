// Direct Supabase fetches for the essay planner — question-aware quote
// retrieval. These bypass the ContentBundle because they need per-question
// junction table lookups that are too large to bundle at page load.

import { supabase } from "@/integrations/supabase/client";
import type { QuoteMethod } from "@/data/seed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawFrom = (table: string) => (supabase as any).from(table);

/** REQ-P1 primary: fetch quotes linked to a specific question via the
 *  quote_question_links junction table, filtered by source text. */
export async function fetchQuotesForQuestion(
  questionId: string,
  sourceText: "Hard Times" | "Atonement",
  limit = 20,
): Promise<QuoteMethod[]> {
  try {
    const { data: links } = await rawFrom("quote_question_links")
      .select("quote_id")
      .eq("question_id", questionId);

    const linkedIds: string[] = (links ?? []).map((l: { quote_id: string }) => l.quote_id);
    if (linkedIds.length === 0) return [];

    const { data } = await rawFrom("quote_methods")
      .select("*")
      .eq("is_active", true)
      .eq("source_text", sourceText)
      .in("id", linkedIds)
      .order("is_core_quote", { ascending: false })
      .order("retrieval_priority", { ascending: true, nullsFirst: false })
      .limit(limit);

    return (data ?? []) as unknown as QuoteMethod[];
  } catch {
    return [];
  }
}

/** REQ-P1 fallback: fetch quotes by theme overlap when the junction table
 *  returns fewer than 5 results. excludeIds prevents duplicating primary results. */
export async function fetchQuotesForRoute(
  themes: string[],
  sourceText: "Hard Times" | "Atonement",
  excludeIds: string[] = [],
  limit = 20,
): Promise<QuoteMethod[]> {
  if (themes.length === 0) return [];
  try {
    let query = rawFrom("quote_methods")
      .select("*")
      .eq("is_active", true)
      .eq("source_text", sourceText)
      .overlaps("best_themes", themes)
      .order("is_core_quote", { ascending: false })
      .order("retrieval_priority", { ascending: true, nullsFirst: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data } = await query;
    return (data ?? []) as unknown as QuoteMethod[];
  } catch {
    return [];
  }
}
