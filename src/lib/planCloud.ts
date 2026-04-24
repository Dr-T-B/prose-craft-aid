import type { Database } from "@/integrations/supabase/types";
import type { EssayPlan, ParagraphCard } from "@/lib/planStore";
import type { BuilderHandoffItem } from "@/lib/builderHandoff";
import type { QuestionFamily } from "@/data/seed";

export type EssayPlanRow = Database["public"]["Tables"]["essay_plans"]["Row"];

export function essayPlanToInsert(
  plan: EssayPlan & { is_current?: boolean },
  userId: string
) {
  return {
    user_id: userId,
    client_plan_id: plan.id,
    question_id: plan.question_id ?? null,
    family: plan.family ?? null,
    route_id: plan.route_id ?? null,
    thesis_level: plan.thesis_level,
    thesis_id: plan.thesis_id ?? null,
    selected_quote_ids: plan.selected_quote_ids ?? [],
    ao5_enabled: plan.ao5_enabled ?? false,
    selected_ao5_ids: plan.selected_ao5_ids ?? [],
    notes: plan.notes ?? null,
    paragraph_cards: plan.paragraph_cards ?? [],
    builder_handoffs: plan.builder_handoffs ?? [],
    is_current: plan.is_current ?? false,
  };
}

export function rowToEssayPlan(row: EssayPlanRow): EssayPlan {
  return {
    id: row.client_plan_id ?? row.id,
    updated_at: new Date(row.updated_at).getTime(),
    question_id: row.question_id ?? undefined,
    family: (row.family as QuestionFamily) ?? undefined,
    route_id: row.route_id ?? undefined,
    thesis_level: row.thesis_level as EssayPlan["thesis_level"],
    thesis_id: row.thesis_id ?? undefined,
    selected_quote_ids: (row.selected_quote_ids as string[]) ?? [],
    ao5_enabled: row.ao5_enabled,
    selected_ao5_ids: (row.selected_ao5_ids as string[]) ?? [],
    notes: row.notes ?? undefined,
    paragraph_cards: (row.paragraph_cards as ParagraphCard[]) ?? [],
    builder_handoffs: (row.builder_handoffs as BuilderHandoffItem[]) ?? [],
  };
}
