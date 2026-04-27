export type GradeLevel = 'B' | 'A' | 'A*';
export type AssessmentObjective = 'AO1' | 'AO2' | 'AO3' | 'AO4' | 'AO5';

export type MasteryStatus =
  | 'unseen'
  | 'recognised'
  | 'understood'
  | 'paragraph_ready'
  | 'essay_ready'
  | 'secure';

export type RouteFunction =
  | 'conceptual_anchor'
  | 'evidence_pair'
  | 'method_upgrade'
  | 'context_anchor'
  | 'ao5_evaluation'
  | 'ending_move';

export type ParagraphRouteStep = {
  position: number;
  route_function: RouteFunction;
  quote_pair_id: string;
  quote_pair_code?: string;
  paragraph_focus: string;
  ao_priority: AssessmentObjective[];
  suggested_topic_sentence?: string;
  method_prompt?: string;
  context_prompt?: string;
  comparison_prompt?: string;
  ao5_prompt?: string;
};

export type ThesisRoute = {
  id: string;
  route_code: string;
  theme_id?: string | null;
  theme_label?: string | null;
  route_title: string;
  exam_question_family: string;
  grade_level: Extract<GradeLevel, 'A' | 'A*'>;
  core_argument: string;
  thesis_sentence: string;
  conceptual_upgrade?: string | null;
  ao3_context_frame?: string | null;
  ao5_tension?: string | null;
  paragraph_sequence?: ParagraphRouteStep[] | null;
  recommended_quote_pairs?: string[] | null;
  common_risk?: string | null;
  examiner_value?: string | null;
  route_status?: 'not_started' | 'in_progress' | 'secure';
};

export type QuotePairMini = {
  id: string;
  quote_pair_code: string;
  theme_label: string;
  hard_times_quote: string;
  atonement_quote: string;
  hard_times_location?: string | null;
  atonement_location?: string | null;
  method_category?: string | null;
  hard_times_method?: string | null;
  atonement_method?: string | null;
  key_word_image_focus?: string | null;
  effect_on_meaning?: string | null;
  structural_function?: string | null;
  ao3_historical_context?: string | null;
  ao3_literary_context?: string | null;
  ao3_context_trigger_sentence?: string | null;
  ao4_comparison_type?: string | null;
  how_they_compare?: string | null;
  why_useful_in_essay?: string | null;
  student_action?: string | null;
  ao5_tension?: string | null;
  mastery_status?: MasteryStatus;
};

export type ParagraphBuilderContext = QuotePairMini & {
  thesis_route?: ThesisRoute | null;
  paragraph_step?: ParagraphRouteStep | null;
  recommendation_reason?: string | null;
};

export type ParagraphDraft = {
  id?: string;
  exam_question_id?: string | null;
  thesis_route_id?: string | null;
  quote_pair_id: string;
  paragraph_template_id?: string | null;
  paragraph_position?: number | null;
  paragraph_function?: string | null;
  topic_sentence: string;
  hard_times_analysis: string;
  atonement_analysis: string;
  ao4_comparison: string;
  ao3_context_integration: string;
  ao5_evaluation?: string;
  final_paragraph: string;
  ao1_self_score?: number;
  ao2_self_score?: number;
  ao3_self_score?: number;
  ao4_self_score?: number;
  ao5_self_score?: number;
  draft_status: 'draft' | 'complete' | 'reviewed' | 'rewritten';
};
