// Seeded content for Component 2 Prose: Hard Times & Atonement
// Static seed; expand later without changing shapes.

export type Level = "secure" | "strong" | "top_band";
export type SourceText = "Hard Times" | "Atonement" | "Comparative";

export type QuestionFamily =
  | "childhood" | "class" | "guilt" | "imagination" | "truth"
  | "love" | "gender" | "suffering" | "power" | "endings"
  | "narrative_authority" | "war_industrialism";

export const QUESTION_FAMILY_LABELS: Record<QuestionFamily, string> = {
  childhood: "Childhood",
  class: "Class",
  guilt: "Guilt",
  imagination: "Imagination",
  truth: "Truth & Storytelling",
  love: "Love",
  gender: "Gender & Agency",
  suffering: "Suffering",
  power: "Power",
  endings: "Endings",
  narrative_authority: "Narrative Authority",
  war_industrialism: "War / Industrialism",
};

export interface Route {
  id: string;
  name: string;
  core_question: string;
  hard_times_emphasis: string;
  atonement_emphasis: string;
  comparative_insight: string;
  best_use: string;
  level_tag: Level;
}

export interface Question {
  id: string;
  family: QuestionFamily;
  stem: string;
  primary_route_id: string;
  secondary_route_id: string;
  likely_core_methods: string[];
  level_tag: Level;
}

export interface Thesis {
  id: string;
  route_id: string;
  theme_family: QuestionFamily;
  level: Level;
  thesis_text: string;
  paragraph_job_1_label: string;
  paragraph_job_2_label: string;
  paragraph_job_3_label?: string;
}

export interface ParagraphJob {
  id: string;
  question_family: QuestionFamily;
  route_id: string;
  job_title: string;
  text1_prompt: string; // Hard Times
  text2_prompt: string; // Atonement
  divergence_prompt: string;
  judgement_prompt: string;
}

export interface QuoteMethod {
  id: string;
  source_text: SourceText;
  quote_text: string;
  method: string;
  best_themes: QuestionFamily[];
  effect_prompt: string;
  meaning_prompt: string;
  level_tag: Level;
  // Enriched fields from JSON quote imports (optional — absent on seed-only quotes)
  speaker_or_narrator?: string | null;
  location_reference?: string | null;
  plain_english_meaning?: string | null;
  linked_motifs?: string[] | null;
  linked_context?: string[] | null;
  linked_interpretations?: string[] | null;
  opening_stems?: string[] | null;
  comparative_prompts?: string[] | null;
  grade_priority?: string | null;
  is_core_quote?: boolean | null;
  b_mode_rank?: number | null;
  exam_question_tags?: string[] | null;
  recommended_for_questions?: string[] | null;
  question_types?: string[] | null;
  ao_priority?: string[] | null;
  comparison_strength?: string | null;
  retrieval_priority?: number | null;
  best_used_for?: string[] | null;
}

export interface AO5Tension {
  id: string;
  focus: string;
  dominant_reading: string;
  alternative_reading: string;
  safe_stem: string;
  best_use: QuestionFamily[];
  level_tag: Level;
}

export interface TimedMode {
  id: string;
  label: string;
  duration_minutes: number;
  expected_output: string;
  focus: string;
}

/* ---------------- ROUTES ---------------- */
export const ROUTES: Route[] = [
  {
    id: "r_systems",
    name: "Systems shaping human behaviour",
    core_question: "How do the systems characters live inside (Utilitarian schooling, English class hierarchy) shape what they become?",
    hard_times_emphasis: "Coketown, Gradgrind's schoolroom and the factory system as machinery for producing certain kinds of people.",
    atonement_emphasis: "Tallis estate hierarchy, wartime bureaucracy, and the literary establishment as systems policing behaviour.",
    comparative_insight: "Both novels indict impersonal systems, but Dickens externalises them as smoke and fact, while McEwan internalises them as class instinct and narrative authority.",
    best_use: "Class, power, suffering, gender questions.",
    level_tag: "top_band",
  },
  {
    id: "r_faulty_formation",
    name: "Faulty formation",
    core_question: "What happens to a child whose imaginative or emotional life is suppressed or distorted?",
    hard_times_emphasis: "Louisa and Tom raised on Fact, denied 'fancy', and the consequences for moral life.",
    atonement_emphasis: "Briony's precocious literary imagination and 'orderly spirit' formed inside class privilege.",
    comparative_insight: "Both novels stage childhoods deformed by an idea: in Dickens, the absence of imagination; in McEwan, the excess of it.",
    best_use: "Childhood, imagination, gender, suffering.",
    level_tag: "top_band",
  },
  {
    id: "r_class_mechanism",
    name: "Class as mechanism",
    core_question: "How does class operate as an active mechanism — not a backdrop — that decides what is sayable, knowable and forgivable?",
    hard_times_emphasis: "Stephen Blackpool's silencing; the moral inversion between the Hands and their masters.",
    atonement_emphasis: "Robbie as 'the son of a cleaner' — class assumption as the engine of misreading.",
    comparative_insight: "Class in Dickens crushes from above; in McEwan it whispers from within. Both make class the cause of injustice.",
    best_use: "Class, power, guilt, suffering.",
    level_tag: "strong",
  },
  {
    id: "r_storytelling_truth",
    name: "Storytelling and truth",
    core_question: "Can fiction tell the truth about a life — or does it inevitably distort it?",
    hard_times_emphasis: "Sleary's circus and the redemptive 'fancy' Dickens defends against Fact.",
    atonement_emphasis: "Briony's metafictional confession and the question of whether art can atone.",
    comparative_insight: "Dickens trusts story to humanise; McEwan suspects story of replacing the truth it claims to repair.",
    best_use: "Truth, narrative authority, imagination, endings.",
    level_tag: "top_band",
  },
  {
    id: "r_guilt_repair",
    name: "Guilt and repair",
    core_question: "What does it mean to repair a wrong — and is repair ever fully possible?",
    hard_times_emphasis: "Louisa's collapse and Gradgrind's late, partial reformation.",
    atonement_emphasis: "Briony's lifetime project of atonement through writing, and its insufficiency.",
    comparative_insight: "Dickens permits chastened reform; McEwan denies clean repair, leaving guilt as the ongoing condition.",
    best_use: "Guilt, endings, love, narrative authority.",
    level_tag: "top_band",
  },
  {
    id: "r_imagination_rationality",
    name: "Imagination vs rationality",
    core_question: "When does imagination liberate, and when does it falsify?",
    hard_times_emphasis: "'Fancy' as moral oxygen against Gradgrindian Fact.",
    atonement_emphasis: "Briony's imagination as the very thing that destroys two lives.",
    comparative_insight: "Dickens defends imagination; McEwan exposes its dangers — together they refuse a simple verdict.",
    best_use: "Imagination, truth, childhood, narrative authority.",
    level_tag: "strong",
  },
  {
    id: "r_gender_agency",
    name: "Gender and agency",
    core_question: "What forms of agency are available to women inside these worlds?",
    hard_times_emphasis: "Louisa traded into marriage; Sissy's intuitive moral authority.",
    atonement_emphasis: "Cecilia's defiance, Briony's authorial power, Lola's silenced victimhood.",
    comparative_insight: "Both novels grant women moral insight while denying them institutional power; agency is forced into private channels.",
    best_use: "Gender, love, power, suffering.",
    level_tag: "strong",
  },
];

/* ---------------- QUESTIONS ---------------- */
export const QUESTIONS: Question[] = [
  // CLASS
  { id: "q_class_1", family: "class", stem: "Compare how the writers present class as a force that shapes individual lives in Hard Times and Atonement.", primary_route_id: "r_class_mechanism", secondary_route_id: "r_systems", likely_core_methods: ["dialect", "free indirect discourse", "symbol"], level_tag: "top_band" },
  { id: "q_class_2", family: "class", stem: "‘Class injustice is the engine of both novels.’ In light of this view, compare Hard Times and Atonement.", primary_route_id: "r_class_mechanism", secondary_route_id: "r_guilt_repair", likely_core_methods: ["dialect", "perspective shift", "symbolic naming"], level_tag: "top_band" },
  { id: "q_class_3", family: "class", stem: "Compare how the writers present the moral consequences of class privilege in Hard Times and Atonement.", primary_route_id: "r_class_mechanism", secondary_route_id: "r_systems", likely_core_methods: ["free indirect discourse", "symbol", "irony"], level_tag: "strong" },
  { id: "q_class_4", family: "class", stem: "‘Class decides whose voice is believed.’ Discuss in relation to Hard Times and Atonement.", primary_route_id: "r_class_mechanism", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["dialect", "perspective", "narration"], level_tag: "top_band" },

  // GUILT
  { id: "q_guilt_1", family: "guilt", stem: "Compare the ways the writers present guilt and the desire for repair in Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["metafiction", "structural turn", "interior monologue"], level_tag: "top_band" },
  { id: "q_guilt_2", family: "guilt", stem: "Explore how far guilt is shown to be productive in Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_faulty_formation", likely_core_methods: ["free indirect discourse", "symbol"], level_tag: "strong" },
  { id: "q_guilt_3", family: "guilt", stem: "‘Atonement is impossible; only the attempt matters.’ Discuss in relation to Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["metafiction", "moral aphorism", "structural turn"], level_tag: "top_band" },
  { id: "q_guilt_4", family: "guilt", stem: "Compare how the writers present the relationship between knowledge and guilt in Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_faulty_formation", likely_core_methods: ["interior monologue", "irony"], level_tag: "strong" },

  // TRUTH
  { id: "q_truth_1", family: "truth", stem: "Compare how the writers explore the relationship between fiction and truth in Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["metafiction", "narrator unreliability", "imagery"], level_tag: "top_band" },
  { id: "q_truth_2", family: "truth", stem: "‘Both novels distrust their own storytelling.’ Discuss in relation to Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_guilt_repair", likely_core_methods: ["metafiction", "framing", "intrusive narrator"], level_tag: "top_band" },
  { id: "q_truth_3", family: "truth", stem: "Compare how the writers present the difficulty of telling the truth about a life in Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["narrator unreliability", "metaphor", "free indirect discourse"], level_tag: "strong" },

  // IMAGINATION
  { id: "q_imag_1", family: "imagination", stem: "Compare the writers’ presentation of imagination as a moral force in Hard Times and Atonement.", primary_route_id: "r_imagination_rationality", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["symbol", "metaphor", "free indirect discourse"], level_tag: "strong" },
  { id: "q_imag_2", family: "imagination", stem: "Explore how the writers present the dangers of imagination in Hard Times and Atonement.", primary_route_id: "r_imagination_rationality", secondary_route_id: "r_faulty_formation", likely_core_methods: ["narrator unreliability", "perspective"], level_tag: "top_band" },
  { id: "q_imag_3", family: "imagination", stem: "‘Imagination is the most dangerous and most necessary faculty.’ Discuss with reference to Hard Times and Atonement.", primary_route_id: "r_imagination_rationality", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["symbol", "metafiction", "moral aphorism"], level_tag: "top_band" },

  // CHILDHOOD
  { id: "q_child_1", family: "childhood", stem: "Compare how the writers present the formation — and deformation — of children in Hard Times and Atonement.", primary_route_id: "r_faulty_formation", secondary_route_id: "r_systems", likely_core_methods: ["interior monologue", "symbol", "education imagery"], level_tag: "top_band" },
  { id: "q_child_2", family: "childhood", stem: "‘Childhood in both novels is a site of damage.’ Discuss.", primary_route_id: "r_faulty_formation", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["symbol", "free indirect discourse"], level_tag: "strong" },
  { id: "q_child_3", family: "childhood", stem: "Compare the presentation of the precocious child in Hard Times and Atonement.", primary_route_id: "r_faulty_formation", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["interior monologue", "irony"], level_tag: "strong" },

  // LOVE
  { id: "q_love_1", family: "love", stem: "Compare how love is shown to be shaped — or thwarted — by social forces in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_gender_agency", likely_core_methods: ["dialogue", "symbol", "free indirect discourse"], level_tag: "strong" },
  { id: "q_love_2", family: "love", stem: "‘Love in both novels is presented as a form of resistance.’ Discuss.", primary_route_id: "r_gender_agency", secondary_route_id: "r_systems", likely_core_methods: ["dialogue", "symbol", "interior monologue"], level_tag: "strong" },
  { id: "q_love_3", family: "love", stem: "Compare the writers’ presentation of love as both consolation and damage in Hard Times and Atonement.", primary_route_id: "r_gender_agency", secondary_route_id: "r_guilt_repair", likely_core_methods: ["interior monologue", "metaphor"], level_tag: "top_band" },

  // GENDER
  { id: "q_gender_1", family: "gender", stem: "Compare how the writers present women’s agency in Hard Times and Atonement.", primary_route_id: "r_gender_agency", secondary_route_id: "r_systems", likely_core_methods: ["interior monologue", "perspective", "silence"], level_tag: "strong" },
  { id: "q_gender_2", family: "gender", stem: "‘Women in both novels speak through silences.’ Discuss.", primary_route_id: "r_gender_agency", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["silence", "free indirect discourse", "perspective"], level_tag: "top_band" },
  { id: "q_gender_3", family: "gender", stem: "Compare how the writers present the costs of female compliance in Hard Times and Atonement.", primary_route_id: "r_gender_agency", secondary_route_id: "r_faulty_formation", likely_core_methods: ["interior monologue", "symbol"], level_tag: "strong" },

  // SUFFERING
  { id: "q_suffer_1", family: "suffering", stem: "Compare the presentation of suffering and its causes in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "industrial imagery", "war imagery"], level_tag: "strong" },
  { id: "q_suffer_2", family: "suffering", stem: "‘Suffering in both novels is structural, not accidental.’ Discuss.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "perspective", "imagery"], level_tag: "top_band" },

  // POWER
  { id: "q_power_1", family: "power", stem: "Compare how the writers present the power of institutions over individuals in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "perspective", "naming"], level_tag: "top_band" },
  { id: "q_power_2", family: "power", stem: "‘Power in both novels works most effectively when it is invisible.’ Discuss.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["free indirect discourse", "symbol"], level_tag: "top_band" },

  // ENDINGS
  { id: "q_end_1", family: "endings", stem: "Compare the endings of Hard Times and Atonement and what they suggest about the possibility of repair.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["metafiction", "structural framing", "tone"], level_tag: "top_band" },
  { id: "q_end_2", family: "endings", stem: "‘Both novels end by withholding consolation.’ Discuss.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_guilt_repair", likely_core_methods: ["metafiction", "tone", "framing"], level_tag: "top_band" },

  // NARRATIVE AUTHORITY
  { id: "q_narr_1", family: "narrative_authority", stem: "Compare the writers’ use of narrative authority in Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["intrusive narrator", "metafiction", "free indirect discourse"], level_tag: "top_band" },
  { id: "q_narr_2", family: "narrative_authority", stem: "‘The narrator is the most powerful character in each novel.’ Discuss in relation to Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_guilt_repair", likely_core_methods: ["intrusive narrator", "metafiction"], level_tag: "top_band" },

  // WAR / INDUSTRIALISM
  { id: "q_war_1", family: "war_industrialism", stem: "Compare how the writers present the violence of industry and of war in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "industrial imagery", "war imagery"], level_tag: "strong" },
  { id: "q_war_2", family: "war_industrialism", stem: "‘Both novels expose the human cost of impersonal forces.’ Discuss.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "imagery", "perspective"], level_tag: "top_band" },
];

/* ---------------- THESES ---------------- */
const T = (
  id: string, route_id: string, theme_family: QuestionFamily, level: Level,
  thesis_text: string, j1: string, j2: string, j3?: string
): Thesis => ({ id, route_id, theme_family, level, thesis_text, paragraph_job_1_label: j1, paragraph_job_2_label: j2, paragraph_job_3_label: j3 });

export const THESES: Thesis[] = [
  // CLASS
  T("th_class_secure", "r_class_mechanism", "class", "secure",
    "Both Dickens and McEwan present class as a powerful force that limits what characters can do and say.",
    "Show class as a barrier in Hard Times", "Show class as a barrier in Atonement", "Brief comparison and judgement"),
  T("th_class_strong", "r_class_mechanism", "class", "strong",
    "Dickens and McEwan both present class less as a backdrop than as an active mechanism that decides whose voice is heard, with Dickens externalising it through the silenced Hand and McEwan internalising it through the assumed criminality of 'the son of a cleaner'.",
    "Dickens: class as silencing (Stephen Blackpool)", "McEwan: class as misreading (Robbie)", "Convergence: class as the engine of injustice"),
  T("th_class_top", "r_class_mechanism", "class", "top_band",
    "Although both novels indict class as injustice, Dickens stages it as a visible system to be reformed, while McEwan exposes it as an invisible grammar that even narration itself cannot escape — making Atonement's critique structurally more pessimistic.",
    "Dickens: class as visible, reformable system", "McEwan: class as invisible, internalised grammar", "Divergence: reformability vs structural pessimism"),

  // GUILT
  T("th_guilt_secure", "r_guilt_repair", "guilt", "secure",
    "Both novels show characters who feel guilt and try, in different ways, to make amends.",
    "Gradgrind's late recognition", "Briony's lifelong attempt at atonement", "Compare how successful each repair is"),
  T("th_guilt_strong", "r_guilt_repair", "guilt", "strong",
    "Dickens permits guilt to become productive through chastened recognition, while McEwan refuses any clean repair, presenting atonement as a permanent labour rather than an achieved state.",
    "Dickens: guilt as catalyst for moral repair", "McEwan: guilt as unfinishable labour", "Judgement: which model is more honest?"),
  T("th_guilt_top", "r_guilt_repair", "guilt", "top_band",
    "While Hard Times treats guilt as the necessary precondition for moral renewal, Atonement implicates the very act of writing as guilty, so that McEwan's metafictional turn exposes Dickens's redemptive arc as itself a fiction we choose to believe.",
    "Dickens: guilt as ethical pivot", "McEwan: guilt as condition that contaminates art", "Metafictional reframing: how Atonement reads back over Hard Times"),

  // TRUTH
  T("th_truth_secure", "r_storytelling_truth", "truth", "secure",
    "Both writers explore how stories can shape, and sometimes distort, the truth.",
    "Dickens's defence of 'fancy' against Fact", "Briony as unreliable storyteller", "Compare attitudes to fiction's truth"),
  T("th_truth_strong", "r_storytelling_truth", "truth", "strong",
    "Where Dickens trusts storytelling — embodied in Sleary's circus — to humanise a Fact-bound world, McEwan turns the same faith inside out, presenting fiction as the very mechanism by which truth becomes 'as ghostly as invention'.",
    "Dickens: story as moral counterweight to Fact", "McEwan: story as the displacement of truth", "Comparative judgement"),
  T("th_truth_top", "r_storytelling_truth", "truth", "top_band",
    "Hard Times defends fiction as the moral antidote to a calculating world, but Atonement stages a darker proposition: that fiction is structurally incapable of telling the truth about a life, and that any novel — including itself — is an act of consoling distortion.",
    "Dickens: fiction as moral correction", "McEwan: fiction as ethical compromise", "Structural irony: Atonement implicates its own form"),

  // IMAGINATION
  T("th_imag_secure", "r_imagination_rationality", "imagination", "secure",
    "Both novels show that imagination matters, but they disagree about whether it helps or harms.",
    "Imagination as freedom in Hard Times", "Imagination as danger in Atonement", "Compare verdicts"),
  T("th_imag_strong", "r_imagination_rationality", "imagination", "strong",
    "Dickens treats imagination as the moral oxygen suffocated by Gradgrindian Fact, while McEwan presents the same faculty as the very thing that destroys two lives — together refusing a simple verdict on its value.",
    "Dickens: imagination as liberation", "McEwan: imagination as falsification", "Synthesis: imagination as ethically double-edged"),
  T("th_imag_top", "r_imagination_rationality", "imagination", "top_band",
    "Read together, the two novels constitute an unfinished argument: Dickens defends imagination as the precondition for empathy, but McEwan exposes how that same empathic faculty, ungoverned by humility, can produce the most catastrophic misreadings — making 'fancy' both indispensable and dangerous.",
    "Dickens: imagination as condition of empathy", "McEwan: imagination as ungoverned authority", "Dialectic: indispensability vs danger"),

  // CHILDHOOD
  T("th_child_secure", "r_faulty_formation", "childhood", "secure",
    "Both writers show that childhoods shaped by powerful adult ideas can be damaged.",
    "Louisa and Tom under Gradgrind", "Briony's precocious literary self", "Compare the kinds of damage"),
  T("th_child_strong", "r_faulty_formation", "childhood", "strong",
    "Both novels depict childhoods deformed by an idea — in Dickens, the absence of imagination; in McEwan, its undisciplined excess — making the child the first casualty of the adult worldview around them.",
    "Hard Times: childhood emptied by Fact", "Atonement: childhood overrun by story", "Convergence: child as casualty of an adult idea"),
  T("th_child_top", "r_faulty_formation", "childhood", "top_band",
    "Although both novels stage damaged childhoods, Dickens presents the child as victim of a system that can be reformed, while McEwan presents the child as agent whose imaginative authority itself causes harm — locating responsibility, and therefore guilt, inside the formed self.",
    "Hard Times: child as victim of system", "Atonement: child as agent and author of harm", "Judgement: where responsibility is finally placed"),

  // LOVE
  T("th_love_secure", "r_gender_agency", "love", "secure",
    "Love in both novels is shaped, and often blocked, by the social world surrounding it.",
    "Louisa's loveless marriage to Bounderby", "Robbie and Cecilia separated by class and accusation", "Compare the obstacles each love faces"),
  T("th_love_strong", "r_gender_agency", "love", "strong",
    "Both writers present love as a private value that systems — Utilitarian schooling in Dickens, English class instinct in McEwan — actively work to thwart, so that love appears chiefly as resistance.",
    "Dickens: love starved by Fact (Louisa's marriage)", "McEwan: love criminalised by class (Robbie and Cecilia)", "Comparative judgement on love as resistance"),
  T("th_love_top", "r_gender_agency", "love", "top_band",
    "Both novels treat love as the moral counter-language to systemic damage, but where Dickens permits love its quiet survival in Sissy and Rachael, McEwan shows love itself rewritten by narration, so that its 'happy ending' is exposed as the consoling fiction of a guilty author.",
    "Dickens: love preserved as moral residue", "McEwan: love rewritten by narration", "Divergence: surviving love vs invented love"),

  // GENDER
  T("th_gender_secure", "r_gender_agency", "gender", "secure",
    "Both writers show that women's choices are limited by the social structures around them.",
    "Louisa traded into marriage", "Cecilia and Lola constrained by Tallis hierarchy", "Compare the kinds of constraint"),
  T("th_gender_strong", "r_gender_agency", "gender", "strong",
    "Dickens and McEwan both grant their women moral insight while denying them institutional power, so that female agency is forced into private channels — Sissy's intuition, Cecilia's defiance, Briony's authorship — that the surrounding system either ignores or punishes.",
    "Hard Times: female intuition vs male system", "Atonement: female defiance and silenced victimhood", "Comparative reading of constrained agency"),
  T("th_gender_top", "r_gender_agency", "gender", "top_band",
    "Where Hard Times locates female agency in moral feeling that the system cannot register, Atonement locates it in narrative power that the system cannot prevent — making Briony's authorship both a feminist claim to voice and an ethical liability that the novel will not absolve.",
    "Dickens: agency as unregisterable feeling", "McEwan: agency as authorial power and liability", "Dialectic: voice as victory and as guilt"),

  // SUFFERING
  T("th_suffer_secure", "r_systems", "suffering", "secure",
    "Both novels show that much of the suffering depicted is caused by larger forces, not just individuals.",
    "Hard Times: suffering produced by Coketown and Fact", "Atonement: suffering produced by class assumption and war", "Compare the sources of suffering"),
  T("th_suffer_strong", "r_systems", "suffering", "strong",
    "Both writers present suffering as structural rather than accidental, locating its cause in systems — Utilitarianism and industrial labour in Dickens, English class and modern warfare in McEwan — that work impersonally on individual lives.",
    "Hard Times: industrial system as engine of suffering", "Atonement: class and war as engines of suffering", "Comparative judgement on responsibility"),
  T("th_suffer_top", "r_systems", "suffering", "top_band",
    "Although both novels indict systemic suffering, Dickens directs his outrage outward at a reformable world, while McEwan turns it inward, exposing how the same structures shape the very narration that claims to mourn them — so that even the act of telling becomes complicit.",
    "Dickens: systemic suffering, reformist outrage", "McEwan: systemic suffering, complicit narration", "Divergence: outward critique vs implicated critique"),

  // POWER
  T("th_power_secure", "r_systems", "power", "secure",
    "Both novels show institutions and powerful individuals exerting control over ordinary lives.",
    "Hard Times: school, factory, Bounderby", "Atonement: family, court, military, Marshall", "Compare how the powerful are presented"),
  T("th_power_strong", "r_systems", "power", "strong",
    "Both writers present institutional power as most effective when it appears most natural — Coketown's smoke, Tallis's drawing room — so that ideology is naturalised before it can be argued with.",
    "Hard Times: power naturalised as Fact and smoke", "Atonement: power naturalised as class manners", "Comparative judgement on naturalised power"),
  T("th_power_top", "r_systems", "power", "top_band",
    "Where Hard Times stages power as visible architecture that its narrator can attack from outside, Atonement stages power as the grammar of perception itself, so that even the narrator becomes one of its instruments rather than its judge.",
    "Dickens: power as visible architecture", "McEwan: power as grammar of perception", "Divergence: external critique vs implicated critique"),

  // ENDINGS
  T("th_end_secure", "r_guilt_repair", "endings", "secure",
    "Both novels end by raising the question of whether repair is really possible.",
    "Hard Times: chastened futures and persistent damage", "Atonement: Briony's confession and the rewritten ending", "Compare the consolation each ending offers"),
  T("th_end_strong", "r_guilt_repair", "endings", "strong",
    "Dickens's ending offers chastened, partial reform, while McEwan's ending withdraws even partial consolation by exposing the happy reunion as authored — so that the two endings stage opposite ethics of repair.",
    "Hard Times: partial reform, surviving damage", "Atonement: consolation withdrawn by authorial confession", "Judgement: which ending is more honest?"),
  T("th_end_top", "r_storytelling_truth", "endings", "top_band",
    "Both novels use their endings to test fiction's right to console: Dickens permits the consolation but qualifies it, while McEwan grants the consolation only to expose it as fiction, making the ending of Atonement a verdict on the ending of Hard Times.",
    "Dickens: consolation permitted but qualified", "McEwan: consolation granted then exposed as fiction", "Atonement as a verdict on the realist ending"),

  // NARRATIVE AUTHORITY
  T("th_narr_secure", "r_storytelling_truth", "narrative_authority", "secure",
    "Both novels make their narrators visible and have them shape how we read events.",
    "Dickens's intrusive moralising narrator", "Briony as author of the novel we read", "Compare what each narrator does"),
  T("th_narr_strong", "r_storytelling_truth", "narrative_authority", "strong",
    "Dickens's narrator claims moral authority and uses it to deliver verdicts, while McEwan's narrator interrogates the very authority that lets her speak — so that the two novels stage opposite ethics of telling.",
    "Dickens: narrator as moral judge", "McEwan: narrator as ethical suspect", "Comparative judgement on the right to tell"),
  T("th_narr_top", "r_storytelling_truth", "narrative_authority", "top_band",
    "Where Hard Times deploys its narrator to repair the world it depicts, Atonement deploys its narrator to expose how narration itself can repeat the wrong — so that McEwan's metafictional turn does not just complicate Dickens's confidence, it indicts it.",
    "Dickens: narration as repair", "McEwan: narration as repetition of harm", "Atonement as indictment of realist confidence"),

  // WAR / INDUSTRIALISM
  T("th_war_secure", "r_systems", "war_industrialism", "secure",
    "Both novels show large impersonal forces — industry in Dickens, war in McEwan — damaging individual lives.",
    "Hard Times: Coketown and the Hands", "Atonement: Dunkirk and the wartime hospital", "Compare the costs depicted"),
  T("th_war_strong", "r_systems", "war_industrialism", "strong",
    "Dickens and McEwan both expose impersonal violence — industrial in one, military in the other — as systemic rather than incidental, written into the texture of the world the characters must live in.",
    "Hard Times: industrial violence as system", "Atonement: war as continuation of class violence", "Judgement on impersonal violence"),
  T("th_war_top", "r_systems", "war_industrialism", "top_band",
    "Where Hard Times treats industrial violence as a problem the novel can name and shame, Atonement treats wartime violence as a problem narration cannot fully redeem — so that the human cost in McEwan refuses the moral closure Dickens still grants.",
    "Dickens: violence named and judged", "McEwan: violence in excess of narration's redemptive power", "Divergence: closure vs withheld closure"),
];

/* ---------------- PARAGRAPH JOBS ---------------- */
const PJ = (
  id: string, family: QuestionFamily, route_id: string, job_title: string,
  text1_prompt: string, text2_prompt: string, divergence_prompt: string, judgement_prompt: string
): ParagraphJob => ({ id, question_family: family, route_id, job_title, text1_prompt, text2_prompt, divergence_prompt, judgement_prompt });

export const PARAGRAPH_JOBS: ParagraphJob[] = [
  // CLASS
  PJ("pj_class_silencing", "class", "r_class_mechanism", "Class as silencing / class as misreading",
    "Use Stephen Blackpool's '’Tis a muddle' to show how dialect itself is a marker of class that the novel’s structure refuses to amplify.",
    "Use Robbie as 'the son of a cleaner' to show how class operates as an unspoken assumption that pre-decides his guilt.",
    "Dickens externalises class through visible markers (dialect, smoke, factories); McEwan internalises it as instinctive class reading.",
    "Decide which presentation is more damning, and why."),
  PJ("pj_class_systems", "class", "r_systems", "Class as institutional machinery",
    "Coketown and the Hands: the factory as a class-producing engine.",
    "The Tallis estate and the wartime/legal apparatus that protects Marshall.",
    "Both writers locate class in physical and institutional structures, not just attitudes.",
    "Which institution is shown as more inescapable?"),
  PJ("pj_class_credibility", "class", "r_class_mechanism", "Class and credibility",
    "Bounderby's self-mythologised rise: class lies legitimised by capital.",
    "Marshall and Lola: class providing structural impunity at the trial.",
    "Dickens satirises the class lie from outside; McEwan stages it as the silent grammar of belief itself.",
    "Decide which novel locates credibility more dangerously."),

  // GUILT
  PJ("pj_guilt_repair", "guilt", "r_guilt_repair", "Recognition vs unfinishable atonement",
    "Gradgrind kneeling beside Louisa: late recognition that admits the failure of Fact.",
    "Briony's writing as 'the attempt was all': atonement as ongoing labour rather than achievement.",
    "Dickens permits a chastened reform; McEwan denies the catharsis of completion.",
    "Whose model of guilt is more truthful to lived ethical experience?"),
  PJ("pj_guilt_storytelling", "guilt", "r_storytelling_truth", "Guilt and the ethics of telling",
    "Dickens’s narrator confidently moralises Gradgrind’s collapse.",
    "Briony’s metafictional turn implicates the act of writing in the original wrong.",
    "Where Dickens uses narration to resolve guilt, McEwan uses narration to compound it.",
    "Does narrative form itself carry moral weight here?"),
  PJ("pj_guilt_knowledge", "guilt", "r_guilt_repair", "Knowledge as the seed of guilt",
    "Tom's whelpish knowing what he is doing while doing it; the moral weight of full Gradgrindian rationality.",
    "Briony 'knew' she was lying long before she could say so: knowledge running ahead of moral language.",
    "Dickens treats guilty knowledge as a clarifying turning point; McEwan treats it as a slow contamination.",
    "Decide which novel makes knowledge a heavier ethical burden."),

  // TRUTH
  PJ("pj_truth_fiction", "truth", "r_storytelling_truth", "Fiction as antidote vs fiction as displacement",
    "Sleary’s circus and 'people muth be amuthed': fiction as moral oxygen.",
    "Briony’s line that 'the truth had become as ghostly as invention'.",
    "Dickens trusts story to redeem; McEwan suspects it of replacing the truth it claims to repair.",
    "Which novel’s view of fiction is more persuasive?"),
  PJ("pj_truth_authority", "truth", "r_storytelling_truth", "Truth and narrative authority",
    "Dickens’s intrusive narrator delivering moral verdicts on Coketown.",
    "Briony as the author whose final confession destabilises every prior claim to truth.",
    "Dickens claims authority on truth’s behalf; McEwan exposes that very claim as part of the problem.",
    "Decide which novel takes the riskier ethical position."),

  // IMAGINATION
  PJ("pj_imag_double", "imagination", "r_imagination_rationality", "Imagination as oxygen vs imagination as authority",
    "Sissy’s 'fancy' and the horse-rider’s daughter: imagination as moral capacity.",
    "Briony’s authorial 'orderly spirit' that misreads Robbie and Cecilia at the fountain.",
    "Imagination liberates the suppressed Hands child but blinds the privileged Tallis child.",
    "What conditions decide whether imagination heals or harms?"),
  PJ("pj_imag_empathy", "imagination", "r_imagination_rationality", "Imagination and the recognition of others",
    "Dickens's aphorism that ethics begins in 'the simple truth that other people are as real as you'.",
    "Briony's question 'Was everyone else really as alive as she was?' — empathy not yet achieved.",
    "Dickens makes imagination the precondition of ethics; McEwan makes its absence the precondition of harm.",
    "Decide whether the two novels finally agree about imagination's moral function."),

  // CHILDHOOD
  PJ("pj_child_formation", "childhood", "r_faulty_formation", "Children formed by an adult idea",
    "Louisa staring into the fire: 'a fire with nothing to burn'.",
    "Briony at thirteen, ‘determined to write’: the child as junior author.",
    "Hard Times shows imagination starved out; Atonement shows it overfed and ungoverned.",
    "Which is more dangerous: the suppressed imagination or the unchecked one?"),
  PJ("pj_child_precocious", "childhood", "r_faulty_formation", "The precocious child",
    "Tom and Louisa as miniature Gradgrindians, performing maturity they have not earned.",
    "Briony's 'orderly spirit' as precocious literary authority that pre-empts adult judgement.",
    "Dickens's precocious children are emptied by their training; McEwan's is overfilled by hers.",
    "Decide which form of precocity does more lasting damage."),

  // LOVE
  PJ("pj_love_thwarted", "love", "r_gender_agency", "Love thwarted by social structure",
    "Louisa's loveless marriage to Bounderby as economic transaction inside Gradgrindian rationality.",
    "Robbie and Cecilia separated by class assumption and judicial machinery.",
    "Dickens stages love blocked by ideology; McEwan stages love criminalised by class.",
    "Which obstacle is the more structural?"),
  PJ("pj_love_resistance", "love", "r_gender_agency", "Love as resistance",
    "Sissy and Rachael as quiet moral counter-currents to the Coketown ethos.",
    "Cecilia's 'I'll wait for you' and the library scene: love as deliberate defiance of the family code.",
    "Dickens permits love as moral residue; McEwan elevates it to defiance and then withdraws it.",
    "Decide whether love finally functions as resistance or as casualty."),

  // GENDER
  PJ("pj_gender_silence", "gender", "r_gender_agency", "Speaking through silence",
    "Louisa's near-mute interior life: agency surviving as unspoken feeling.",
    "Lola's silence after the assault: agency erased by class and gendered intimidation.",
    "Dickens's silenced woman is interior; McEwan's is structurally erased.",
    "Which silence is the more damning indictment?"),
  PJ("pj_gender_authority", "gender", "r_gender_agency", "Female authority within male systems",
    "Sissy's intuitive moral authority that the schoolroom cannot register.",
    "Briony as author of the novel itself: female authority claimed in the form of narration.",
    "Dickens grants women feeling without voice; McEwan grants Briony voice without absolution.",
    "Decide which model of female authority is harder won."),

  // SUFFERING
  PJ("pj_suffer_systemic", "suffering", "r_systems", "Suffering produced by systems",
    "Stephen Blackpool's death and the Hands' conditions: suffering as the routine output of Coketown.",
    "Robbie's wartime march and the hospital wards: suffering as the routine output of class plus war.",
    "Dickens makes the system the named villain; McEwan makes it the unnamed background.",
    "Which presentation is more politically forceful?"),

  // POWER
  PJ("pj_power_invisible", "power", "r_systems", "Power as invisible architecture",
    "Coketown's smoke and the schoolroom's geometry: power inscribed in the physical environment.",
    "The Tallis drawing room and the courts: power inscribed in manners and procedure.",
    "Dickens externalises power into smoke and brick; McEwan internalises it into etiquette and assumption.",
    "Decide which form of power is harder to resist."),

  // ENDINGS
  PJ("pj_end_consolation", "endings", "r_guilt_repair", "Consolation permitted vs consolation withdrawn",
    "The chastened Gradgrind and the surviving damage of the final chapters.",
    "Briony's 'happy ending' for Robbie and Cecilia, exposed as authored.",
    "Dickens permits qualified consolation; McEwan grants it only to expose it as fiction.",
    "Which ending is more honest about repair?"),

  // NARRATIVE AUTHORITY
  PJ("pj_narr_judge_vs_suspect", "narrative_authority", "r_storytelling_truth", "Narrator as judge vs narrator as suspect",
    "Dickens's narrator delivering verdicts on Bounderby and the schoolroom.",
    "Briony as narrator interrogating her own right to tell the story.",
    "Dickens's narration repairs the world; McEwan's narration interrogates the act of repair.",
    "Decide which ethic of telling is more demanding."),

  // WAR / INDUSTRIALISM
  PJ("pj_war_human_cost", "war_industrialism", "r_systems", "Human cost of impersonal forces",
    "Coketown's serpents of smoke and the Hands as collateral of industrial productivity.",
    "Dunkirk and the wartime hospital as collateral of imperial and class machinery.",
    "Dickens condenses violence into industrial imagery; McEwan disperses it across war and class.",
    "Which novel registers the cost more unflinchingly?"),
];

/* ---------------- QUOTE METHODS ---------------- */
const Q = (
  id: string, source_text: SourceText, quote_text: string, method: string,
  best_themes: QuestionFamily[], effect_prompt: string, meaning_prompt: string, level_tag: Level
): QuoteMethod => ({ id, source_text, quote_text, method, best_themes, effect_prompt, meaning_prompt, level_tag });

export const QUOTE_METHODS: QuoteMethod[] = [
  // HARD TIMES — Fact / education / power
  Q("qm_facts", "Hard Times", "Now, what I want is, Facts.", "imperative + abstract noun capitalised as proper noun",
    ["truth", "imagination", "childhood", "power"],
    "The capital F reifies an ideology into a deity; the imperative grammar enacts its coercion.",
    "Dickens makes Fact the antagonist of the entire novel in its opening sentence.", "strong"),
  Q("qm_girl20", "Hard Times", "Girl number twenty", "depersonalising numeric address",
    ["childhood", "class", "power", "gender"],
    "Sissy is reduced to an integer in a register; the system speaks first, the person never.",
    "The school converts persons into units of measurable Fact.", "strong"),
  Q("qm_define_horse", "Hard Times", "Quadruped. Graminivorous. Forty teeth…", "list of taxonomic nouns replacing experience",
    ["imagination", "childhood", "truth", "power"],
    "Bitzer's definition empties the horse of everything Sissy actually knows about it.",
    "Knowledge that excludes acquaintance is exposed as a parody of knowing.", "strong"),
  Q("qm_model_child", "Hard Times", "the little pitchers before him… filled so full…", "metaphor of children as containers",
    ["childhood", "imagination", "power"],
    "Children become passive vessels for adult ideology rather than developing minds.",
    "Education is figured as a mechanical pouring rather than an unfolding.", "strong"),

  // HARD TIMES — class / labour / industry
  Q("qm_hands", "Hard Times", "the Hands", "synecdoche",
    ["class", "suffering", "power"],
    "Workers are named only by the body part the system needs from them.",
    "Class oppression is inscribed in the very vocabulary the novel inherits.", "secure"),
  Q("qm_serpents", "Hard Times", "interminable serpents of smoke", "biblical allusion + endless modifier",
    ["war_industrialism", "suffering", "power"],
    "The Edenic serpent rewritten as industrial pollution; ‘interminable’ refuses any redemptive ending.",
    "Industry is figured as a fallen, repeating sin without exit.", "top_band"),
  Q("qm_elephant", "Hard Times", "piston of the steam-engine worked monotonously up and down, like the head of an elephant in a state of melancholy madness", "extended industrial simile",
    ["war_industrialism", "suffering", "power"],
    "The machinery is animalised as both pathetic and unhinged; productivity figured as madness.",
    "Industrial repetition is presented as a form of collective insanity.", "top_band"),
  Q("qm_muddle", "Hard Times", "’Tis a muddle", "dialect + reduction of systemic injustice to a single word",
    ["class", "suffering", "power"],
    "Stephen's dialect marks his exclusion from the discourse able to name his oppression.",
    "The novel concedes that the wronged man cannot fully articulate the system that wrongs him.", "top_band"),

  // HARD TIMES — Bounderby / hypocrisy
  Q("qm_bounderby_self", "Hard Times", "Josiah Bounderby of Coketown", "epithet repeated as self-myth",
    ["class", "power", "truth"],
    "The repeated formula performs Bounderby's self-mythology until it is exposed as a lie.",
    "Dickens satirises bourgeois self-making as a class fiction sustained by repetition.", "strong"),

  // HARD TIMES — Louisa / repression
  Q("qm_fire", "Hard Times", "a fire with nothing to burn", "metaphor of starved interiority",
    ["childhood", "imagination", "gender"],
    "Louisa’s inner life is figured as combustion without fuel — desire without object.",
    "Gradgrindian education has emptied the imagination it was meant to discipline.", "top_band"),
  Q("qm_louisa_father", "Hard Times", "Father, I have often thought that life is very short", "free indirect speech bordering on confession",
    ["gender", "childhood", "love", "suffering"],
    "Louisa's restrained voice carries the entire weight of Gradgrindian damage in a single muted line.",
    "Female interiority surfaces only as quiet philosophical resignation.", "top_band"),

  // HARD TIMES — Sissy / imagination / ethics
  Q("qm_truth_real", "Hard Times", "the simple truth that other people are as real as you", "moral aphorism",
    ["truth", "imagination", "guilt"],
    "Dickens locates ethics in the imaginative recognition of others as real.",
    "Imagination is presented not as decoration but as the precondition for moral life.", "top_band"),
  Q("qm_amused", "Hard Times", "people muth be amuthed", "lisped vernacular + moral truism",
    ["imagination", "truth", "endings"],
    "Sleary's lisp marks the circus as a marginal voice carrying central moral wisdom.",
    "Dickens locates the novel's defence of fancy in a working-class, comic register.", "strong"),

  // ATONEMENT — Briony / perspective / authority
  Q("qm_alive", "Atonement", "Was everyone else really as alive as she was?", "free indirect interrogative",
    ["imagination", "narrative_authority", "guilt"],
    "Briony's narrative power begins in solipsism that has not yet recognised other minds.",
    "The novel locates the seed of her later harm in this failure of imaginative reciprocity.", "top_band"),
  Q("qm_orderly", "Atonement", "her passion for tidiness… an orderly spirit", "characterising abstract noun",
    ["imagination", "childhood", "narrative_authority"],
    "Briony's authorial impulse is named as a will to impose order on disorderly experience.",
    "The novel diagnoses storytelling itself as a form of imposed order.", "strong"),
  Q("qm_atonement", "Atonement", "How can a novelist achieve atonement…?", "rhetorical question by intrusive author-figure",
    ["guilt", "narrative_authority", "endings"],
    "The novel breaks frame to ask whether its own form is morally adequate.",
    "Metafiction is used as ethical interrogation, not stylistic play.", "top_band"),
  Q("qm_attempt", "Atonement", "the attempt was all", "aphoristic coda by the author-figure",
    ["guilt", "endings", "narrative_authority"],
    "Atonement is reduced to effort rather than achievement; closure is replaced by ongoing labour.",
    "McEwan rewrites repair as a permanent ethical posture, not a destination.", "top_band"),

  // ATONEMENT — Robbie / class
  Q("qm_cleaner", "Atonement", "the son of a cleaner", "class-marked epithet inside free indirect discourse",
    ["class", "guilt", "power"],
    "Class assumption is smuggled into perception itself; the phrase pre-decides Robbie’s guilt.",
    "McEwan exposes how class operates as an invisible interpretive frame.", "top_band"),
  Q("qm_maniac", "Atonement", "I saw him with my own eyes", "first-person testimonial certainty",
    ["truth", "guilt", "narrative_authority"],
    "Briony's testimonial confidence converts imagination into legal evidence.",
    "The novel exposes how narrative certainty can do the work of perjury.", "top_band"),

  // ATONEMENT — Cecilia / love
  Q("qm_come_back", "Atonement", "I'll wait for you. Come back.", "minimal dialogue carrying full emotional weight",
    ["love", "war_industrialism", "endings"],
    "The pared-down register makes the promise feel both private and conscripted by history.",
    "Love is figured as the small counter-language to systemic violence.", "strong"),

  // ATONEMENT — Marshall / power
  Q("qm_amo", "Atonement", "Amo bars", "mock-Latin commodity name (love-as-product)",
    ["power", "class", "war_industrialism"],
    "Marshall's product reduces love to wartime commodity; etymology mocks his moral world.",
    "Class impunity is bankrolled by the industrialisation of feeling itself.", "top_band"),

  // ATONEMENT — guilt / fiction
  Q("qm_ghostly", "Atonement", "The truth had become as ghostly as invention", "simile collapsing the truth/fiction binary",
    ["truth", "narrative_authority", "guilt"],
    "Truth and fiction are made indistinguishable, undermining the consoling power of story.",
    "Atonement turns the realist confidence in narration against itself.", "top_band"),
  Q("qm_no_one", "Atonement", "No one will care what events and which individuals were misrepresented", "intrusive narrator's pre-emptive defence",
    ["truth", "narrative_authority", "guilt", "endings"],
    "Briony anticipates the reader's complaint and defuses it, performing the ethical compromise the novel exposes.",
    "Metafiction is used to stage the very evasion it diagnoses.", "top_band"),

  // ATONEMENT — war / human cost
  Q("qm_dunkirk", "Atonement", "the smell of cordite and rotting flesh", "sensory list refusing literary mediation",
    ["war_industrialism", "suffering"],
    "Olfactory bluntness resists the consolations of literary war writing.",
    "McEwan stages war as a human cost the prose cannot stylise away.", "strong"),
  Q("qm_three_words", "Atonement", "She was running, and that was all there was", "reduction to bare action under wartime stress",
    ["suffering", "gender", "war_industrialism"],
    "Syntax flattens to survival; the literary self is stripped to motion.",
    "Wartime experience is presented as the temporary suspension of interiority.", "strong"),

  // COMPARATIVE
  Q("qm_cmp_voice", "Comparative", "Stephen’s ‘’Tis a muddle’ // Robbie’s ‘son of a cleaner’", "voiceless figures defined from outside",
    ["class", "power", "suffering", "guilt"],
    "Both novels make their wronged men inarticulate within the discourse of their accusers.",
    "Class injustice in both texts works by deciding who gets to speak as a self.", "strong"),
  Q("qm_cmp_imag", "Comparative", "Sissy’s ‘fancy’ // Briony’s ‘orderly spirit’", "twin presentations of the imagining child",
    ["imagination", "childhood", "truth"],
    "Dickens and McEwan stage opposite verdicts on the moral status of childhood imagination.",
    "Together the texts refuse a single answer about whether imagination saves or destroys.", "top_band"),
  Q("qm_cmp_repair", "Comparative", "Gradgrind’s late kneeling // Briony’s ‘the attempt was all’", "twin scenes of recognition vs unfinishable atonement",
    ["guilt", "endings", "truth", "narrative_authority"],
    "Dickens permits chastened reform; McEwan denies the catharsis of completion.",
    "Together they stage two incompatible models of what guilt can become.", "top_band"),
  Q("qm_cmp_authority", "Comparative", "Dickens’s intrusive narrator // McEwan’s metafictional confession", "narrative authority claimed vs interrogated",
    ["truth", "narrative_authority", "guilt", "endings"],
    "Where Dickens’s narrator delivers verdicts, McEwan’s narrator implicates the act of narration itself.",
    "The two novels stage opposite ethics of telling.", "top_band"),
  Q("qm_cmp_women", "Comparative", "Louisa's silence // Lola's silence", "twin female silences with different causes",
    ["gender", "guilt", "power", "suffering"],
    "Dickens's silenced woman is interiorised; McEwan's is structurally erased.",
    "Both novels make female silence the diagnostic of male systems.", "top_band"),
  Q("qm_cmp_systems", "Comparative", "Coketown smoke // Tallis manners", "twin atmospheres of naturalised power",
    ["power", "class", "suffering"],
    "Both writers naturalise power into atmosphere — pollution in one, etiquette in the other.",
    "Power is most dangerous in both novels when it has stopped looking like power.", "strong"),
  Q("qm_cmp_endings", "Comparative", "Hard Times' chastened futures // Atonement's authored happy ending", "twin endings testing fiction's right to console",
    ["endings", "guilt", "truth", "narrative_authority"],
    "Dickens permits qualified consolation; McEwan grants it only to expose it as fiction.",
    "The two endings stage incompatible ethics of repair.", "top_band"),
];

/* ---------------- AO5 TENSIONS ---------------- */
const A5 = (
  id: string, focus: string, dominant_reading: string, alternative_reading: string,
  safe_stem: string, best_use: QuestionFamily[], level_tag: Level
): AO5Tension => ({ id, focus, dominant_reading, alternative_reading, safe_stem, best_use, level_tag });

export const AO5_TENSIONS: AO5Tension[] = [
  A5("ao5_briony", "Briony's guilt",
    "Briony’s lifelong writing is a sincere attempt at atonement.",
    "Her writing is a self-serving displacement that lets her control the story she damaged.",
    "Some readers see Briony's narrative as ethical labour, while others read it as a refusal to relinquish authorial power.",
    ["guilt", "narrative_authority", "endings"], "top_band"),
  A5("ao5_dickens_satire", "Dickens’s satire",
    "Dickens’s satire of Utilitarianism is a moral indictment of an inhuman system.",
    "The satire is broad and caricatured, weakening its political force.",
    "While many readers value Dickens’s satire as moral critique, others find its caricature limits its analytical reach.",
    ["class", "power", "imagination", "childhood"], "strong"),
  A5("ao5_fiction_atonement", "Fiction in Atonement",
    "Fiction in Atonement is presented as ethically necessary, the only available form of repair.",
    "Fiction is presented as ethically suspect, the very mechanism that makes repair impossible.",
    "Atonement can be read as defending fiction’s reparative power or as exposing its moral limits.",
    ["truth", "narrative_authority", "guilt", "endings"], "top_band"),
  A5("ao5_class_atonement", "Class in Atonement",
    "Class is shown as a residual prejudice exposed and condemned by the novel.",
    "Class is shown as so structurally embedded that even the narrative voice is implicated in it.",
    "Critics differ on whether McEwan diagnoses class prejudice from outside or implicates his own narration in it.",
    ["class", "power", "guilt"], "top_band"),
  A5("ao5_louisa", "Louisa",
    "Louisa is a tragic victim of Gradgrindian education.",
    "Louisa retains a quiet interior agency that resists the system that formed her.",
    "Some critics emphasise Louisa as victim of Fact, while others stress her residual interior resistance.",
    ["gender", "childhood", "imagination", "suffering"], "strong"),
  A5("ao5_sissy", "Sissy Jupe",
    "Sissy is the moral compass the novel uses to indict Gradgrindian Fact.",
    "Sissy is an idealised symbol whose ethical authority is unargued and sentimental.",
    "Some readers see Sissy as the novel's ethical centre, while others find her morally idealised in ways that flatten the critique.",
    ["imagination", "childhood", "love", "gender"], "strong"),
  A5("ao5_narr_authority", "Narrative authority",
    "Both novels use their narrators to deliver moral verdicts on the worlds they describe.",
    "Atonement undermines this very authority, forcing the reader to question who has the right to tell.",
    "Where Dickens’s narrator claims moral authority, McEwan’s narrator interrogates it.",
    ["narrative_authority", "truth", "guilt", "endings"], "top_band"),
  A5("ao5_repair_irreparable", "Repair vs irreparability",
    "Both novels permit a chastened form of repair through recognition and effort.",
    "Repair is exposed in Atonement as an authored consolation that the original wrong cannot really afford.",
    "Critics divide on whether the novels finally offer repair or expose the wish for it as fiction.",
    ["guilt", "endings", "love"], "top_band"),
  A5("ao5_imag_moral", "Imagination as moral power or danger",
    "Imagination is the moral oxygen the novels defend against rationalist or class blindness.",
    "Imagination is the very faculty that, ungoverned, produces the worst harm in both novels.",
    "Read together, the texts can be taken either to defend imagination or to expose its dangers.",
    ["imagination", "truth", "childhood", "narrative_authority"], "top_band"),
  A5("ao5_fiction_ethics", "Fiction and ethics",
    "Fiction is presented as a form of moral knowledge that empirical thought cannot reach.",
    "Fiction is presented as an inherently compromised form whose consolations are suspect.",
    "Critics differ on whether the novels finally trust or distrust fiction's ethical reach.",
    ["truth", "narrative_authority", "guilt"], "top_band"),
];

/* ---------------- TIMED MODES ---------------- */
export const TIMED_MODES: TimedMode[] = [
  { id: "tm_12", label: "12-minute paragraph", duration_minutes: 12, expected_output: "One developed analytical paragraph", focus: "Tight method-led paragraph with judgement clause." },
  { id: "tm_25", label: "25-minute intro + 2 paragraphs", duration_minutes: 25, expected_output: "Thesis intro + two body paragraphs", focus: "Frame the argument and prove it twice." },
  { id: "tm_35", label: "35-minute mini essay", duration_minutes: 35, expected_output: "Compressed full essay shape", focus: "Whole-essay shape under pressure." },
  { id: "tm_75", label: "75-minute full essay", duration_minutes: 75, expected_output: "Full Component 2 essay", focus: "Exam-condition full response." },
];

/* ---------------- CHARACTERS / THEMES (lightweight retrieval) ---------------- */
export interface CharacterEntry {
  id: string;
  source_text: SourceText;
  name: string;
  one_line: string;
  themes: QuestionFamily[];
  /** richer optional fields, surfaced when present */
  core_function?: string;
  complication?: string;
  structural_role?: string;
  comparative_link?: string;
  common_misreading?: string;
}

export const CHARACTERS: CharacterEntry[] = [
  // HARD TIMES
  {
    id: "c_gradgrind", source_text: "Hard Times", name: "Thomas Gradgrind",
    one_line: "The man of Fact, chastened only when his system breaks his own family.",
    themes: ["power", "guilt", "imagination", "childhood"],
    core_function: "Embodies Utilitarian rationalism as parental and pedagogical authority.",
    complication: "His late recognition admits the failure of Fact, but only after the damage is done.",
    structural_role: "His arc supplies the novel's central reformist trajectory from doctrine to chastened feeling.",
    comparative_link: "Mirrors and contrasts Briony as a figure undone by their own framework of certainty.",
    common_misreading: "Treating his late repentance as full redemption rather than partial, costly recognition.",
  },
  {
    id: "c_louisa", source_text: "Hard Times", name: "Louisa Gradgrind",
    one_line: "Daughter raised on Fact; the novel's interior cost of Utilitarianism.",
    themes: ["childhood", "gender", "imagination", "suffering"],
    core_function: "Registers the human cost of Gradgrindian education in her muted interiority.",
    complication: "Her quiet resistance — the fire metaphor — survives without ever becoming a public voice.",
    structural_role: "Her near-collapse triggers Gradgrind's recognition and the novel's moral pivot.",
    comparative_link: "Her interior silence parallels Cecilia's defiance and Lola's structural silencing.",
    common_misreading: "Reading her purely as victim and missing her residual interior agency.",
  },
  {
    id: "c_tom", source_text: "Hard Times", name: "Tom Gradgrind",
    one_line: "Whelp; the moral failure of an emotionally starved upbringing.",
    themes: ["childhood", "guilt", "class"],
    core_function: "Exemplifies Gradgrindian formation producing self-interested calculation rather than virtue.",
    complication: "His fall is genuine moral failure, not just product of system, complicating pure-victim readings.",
    structural_role: "Provides the criminal plot that exposes Bounderby's world from inside.",
    comparative_link: "Echoes Briony as a precocious child whose formation produces real ethical harm.",
    common_misreading: "Reducing him to symptom and ignoring his own culpable choices.",
  },
  {
    id: "c_bounderby", source_text: "Hard Times", name: "Josiah Bounderby",
    one_line: "Self-mythologising bully; the bourgeois lie about self-making.",
    themes: ["class", "power", "truth"],
    core_function: "Personifies the class lie that capital is morally earned.",
    complication: "His exposure as fraud is comic rather than tragic, raising the question of how seriously the novel takes capital.",
    structural_role: "Functions as the novel's class antagonist alongside Gradgrind's intellectual one.",
    comparative_link: "Pairs with Marshall: each is a powerful man insulated by class from his own conduct.",
    common_misreading: "Treating him as caricature only and missing the systemic point his exposure makes.",
  },
  {
    id: "c_sissy", source_text: "Hard Times", name: "Sissy Jupe",
    one_line: "The horse-rider's daughter who carries 'fancy' as moral knowledge.",
    themes: ["imagination", "childhood", "love", "gender"],
    core_function: "Embodies fancy as the moral counter-language to Gradgrindian Fact.",
    complication: "Her authority is intuitive and unargued, which limits how far the novel can defend it analytically.",
    structural_role: "Provides the moral residue that survives the system's collapse and shelters the next generation.",
    comparative_link: "Inverts Briony: Sissy is the underprivileged imagining child whose imagination is benign.",
    common_misreading: "Reading her as sentimental token rather than as the novel's ethical centre.",
  },
  {
    id: "c_stephen", source_text: "Hard Times", name: "Stephen Blackpool",
    one_line: "The silenced Hand whose dialect itself marks his exclusion.",
    themes: ["class", "suffering", "power"],
    core_function: "Embodies the moral integrity of the working class denied institutional voice.",
    complication: "The novel's structure does not fully amplify him, raising questions about Dickens's own class limits.",
    structural_role: "His death is the novel's strongest indictment of the system that frames him.",
    comparative_link: "Direct parallel to Robbie: both are wronged men inarticulate within the discourse of their accusers.",
    common_misreading: "Treating his suffering as personal misfortune rather than as structural exposure.",
  },
  {
    id: "c_mrs_sparsit", source_text: "Hard Times", name: "Mrs Sparsit",
    one_line: "Aristocratic relic policing Bounderby's household and Louisa's reputation.",
    themes: ["gender", "class", "power"],
    core_function: "Stages how class snobbery reproduces itself even from a position of decline.",
    complication: "Her surveillance of Louisa parodies bourgeois moralism while sharing its mechanics.",
    structural_role: "Provides the comic-pathological observer who tracks Louisa's near-fall.",
    comparative_link: "Echoes Emily Tallis as a disempowered class custodian still policing female behaviour.",
    common_misreading: "Treating her as pure comic relief and missing her function in the gender-class machinery.",
  },
  {
    id: "c_rachael", source_text: "Hard Times", name: "Rachael",
    one_line: "Stephen's quiet moral counterweight; love as endurance under class injury.",
    themes: ["love", "gender", "suffering", "class"],
    core_function: "Embodies private moral steadiness against systemic injury.",
    complication: "Her saintliness is barely individuated, raising questions about the novel's idealisation of working-class women.",
    structural_role: "Provides the private moral anchor against which Stephen's public destruction is measured.",
    comparative_link: "Pairs with Cecilia as the woman whose love survives the system that wrongs her partner.",
    common_misreading: "Reducing her to passive suffering and missing the active moral labour of her steadiness.",
  },

  // ATONEMENT
  {
    id: "c_briony", source_text: "Atonement", name: "Briony Tallis",
    one_line: "Author of the wrong and of its lifelong narration.",
    themes: ["guilt", "imagination", "narrative_authority", "childhood"],
    core_function: "Embodies the dangerous power of imaginative authority unchecked by humility.",
    complication: "Her later writing is both ethical labour and ongoing assertion of authorial control.",
    structural_role: "She is the cause of the central wrong and the narrator of the novel that records it.",
    comparative_link: "Mirrors Gradgrind: each is undone by their own framework, but Briony cannot be repaired by recognition alone.",
    common_misreading: "Treating her atonement as achieved rather than as permanent labour.",
  },
  {
    id: "c_robbie", source_text: "Atonement", name: "Robbie Turner",
    one_line: "‘The son of a cleaner’ whose class makes him pre-readable as guilty.",
    themes: ["class", "guilt", "love", "war_industrialism"],
    core_function: "Exposes class assumption as the engine of misreading and judicial harm.",
    complication: "His wartime narrative resists pure-victim status; he is morally complex, not simply wronged.",
    structural_role: "His silencing is the novel's clearest indictment of class as interpretive frame.",
    comparative_link: "Direct parallel to Stephen Blackpool — both wronged men silenced by the discourse of their accusers.",
    common_misreading: "Reducing his story to romantic tragedy and missing its structural class diagnosis.",
  },
  {
    id: "c_cecilia", source_text: "Atonement", name: "Cecilia Tallis",
    one_line: "The defying sister; love as refusal of the family order.",
    themes: ["love", "gender", "class"],
    core_function: "Stages love and loyalty as deliberate defiance of class and family code.",
    complication: "Her defiance is both moral courage and class privilege exercising itself differently.",
    structural_role: "Provides the love plot that the novel's ending will reveal as authored.",
    comparative_link: "Pairs with Rachael as the woman whose love survives the system that wrongs her partner.",
    common_misreading: "Treating her ending as restored rather than as Briony's authored consolation.",
  },
  {
    id: "c_marshall", source_text: "Atonement", name: "Paul Marshall",
    one_line: "The protected predator; class as structural impunity.",
    themes: ["class", "power", "guilt", "war_industrialism"],
    core_function: "Embodies class impunity sustained by wealth, marriage, and silence.",
    complication: "His success is not punished by the novel — the text refuses comic-Dickensian comeuppance.",
    structural_role: "His unbroken arc indicts the system's failure to correct itself.",
    comparative_link: "Pairs with Bounderby: each is insulated by class from the conduct that should disgrace them.",
    common_misreading: "Treating his villainy as personal rather than as a verdict on structural impunity.",
  },
  {
    id: "c_lola", source_text: "Atonement", name: "Lola Quincey",
    one_line: "The silenced victim whose silence the novel tracks across decades.",
    themes: ["gender", "guilt", "power", "class"],
    core_function: "Exposes how class and gender combine to convert violence into silence.",
    complication: "Her later marriage to Marshall complicates a pure-victim reading and forces ethical judgement.",
    structural_role: "Her unbroken silence frames the novel's diagnosis of impunity.",
    comparative_link: "Mirrors Louisa's silence with structural rather than interior cause.",
    common_misreading: "Treating her marriage as choice rather than as the novel's bleakest structural verdict.",
  },
  {
    id: "c_emily", source_text: "Atonement", name: "Emily Tallis",
    one_line: "The migraine-laden mother; class custodianship in private collapse.",
    themes: ["gender", "class", "power"],
    core_function: "Embodies the way class authority is reproduced even in physical incapacity.",
    complication: "Her perception is partial and self-protective, complicating any reliable maternal voice.",
    structural_role: "Her acquiescence enables the misreading of Robbie that drives the plot.",
    comparative_link: "Pairs with Mrs Sparsit as a disempowered woman policing other women's reputations.",
    common_misreading: "Reading her purely as ineffectual and missing her structural complicity.",
  },
  {
    id: "c_jack", source_text: "Atonement", name: "Jack Tallis",
    one_line: "Absent father; institutional power located off-stage.",
    themes: ["power", "class", "war_industrialism"],
    core_function: "Embodies state and class authority as structurally absent yet decisive.",
    complication: "His absence makes him hard to attack directly, exposing how impersonal power evades critique.",
    structural_role: "His off-stage decisions about Robbie's education and conviction frame the plot.",
    comparative_link: "Functions like Coketown's smoke — the atmospheric authority that need not appear to act.",
    common_misreading: "Treating him as marginal because absent, missing his structural weight.",
  },
];

/* ---------------- THEMES (lightweight retrieval) ---------------- */
export interface ThemeEntry {
  id: string;
  family: QuestionFamily;
  one_line: string;
}
export const THEMES: ThemeEntry[] = (Object.keys(QUESTION_FAMILY_LABELS) as QuestionFamily[]).map((f) => ({
  id: `t_${f}`,
  family: f,
  one_line: {
    childhood: "Children formed — and deformed — by adult ideas.",
    class: "Class as an active mechanism that decides whose voice counts.",
    guilt: "Guilt as catalyst (Dickens) and as unfinishable labour (McEwan).",
    imagination: "Imagination as moral oxygen and as ungoverned authority.",
    truth: "Whether fiction can tell the truth about a life.",
    love: "Love thwarted or constrained by social structure.",
    gender: "What forms of agency remain available to women.",
    suffering: "Suffering produced by systems, not accidents.",
    power: "Institutional power against private life.",
    endings: "What the endings concede about the possibility of repair.",
    narrative_authority: "Who has the right to tell, and on what terms.",
    war_industrialism: "Industrial violence in Dickens, war violence in McEwan.",
  }[f],
}));

/* ---------------- SYMBOLS (lightweight retrieval) ---------------- */
export interface SymbolEntry {
  id: string;
  source_text: SourceText;
  name: string;
  one_line: string;
  themes: QuestionFamily[];
}
export const SYMBOLS: SymbolEntry[] = [
  // Hard Times
  { id: "s_fire", source_text: "Hard Times", name: "Fire", one_line: "Louisa's interior life as 'a fire with nothing to burn' — desire without object.", themes: ["imagination", "childhood", "gender"] },
  { id: "s_smoke", source_text: "Hard Times", name: "Smoke (interminable serpents)", one_line: "Industrial pollution as fallen, repeating sin without exit.", themes: ["war_industrialism", "power", "suffering"] },
  { id: "s_circus", source_text: "Hard Times", name: "Circus / Pegasus", one_line: "Sleary's troupe as the marginal home of fancy and moral oxygen.", themes: ["imagination", "truth", "endings"] },
  { id: "s_staircase", source_text: "Hard Times", name: "Mrs Sparsit's staircase", one_line: "Surveillance of female reputation visualised as imagined descent.", themes: ["gender", "class", "power"] },
  // Atonement
  { id: "s_vase", source_text: "Atonement", name: "The vase", one_line: "Family heirloom whose breaking and repair stage the impossibility of clean restoration.", themes: ["guilt", "endings", "class"] },
  { id: "s_fountain", source_text: "Atonement", name: "The fountain", one_line: "Misread scene that fixes Briony's authorial verdict on Robbie and Cecilia.", themes: ["imagination", "truth", "narrative_authority"] },
  { id: "s_letter", source_text: "Atonement", name: "The letter", one_line: "Wrong-letter intercepted: writing converting private feeling into public evidence.", themes: ["truth", "love", "narrative_authority"] },
  { id: "s_amo", source_text: "Atonement", name: "Amo bars", one_line: "Marshall's commodified love: industrialised feeling bankrolling impunity.", themes: ["power", "class", "war_industrialism"] },
];

/* ---------------- COMPARATIVE MATRIX (lightweight retrieval) ---------------- */
export interface ComparativeMatrixEntry {
  id: string;
  axis: string;
  hard_times: string;
  atonement: string;
  divergence: string;
  themes: QuestionFamily[];
}
export const COMPARATIVE_MATRIX: ComparativeMatrixEntry[] = [
  {
    id: "cmx_class_voice",
    axis: "Class and voice",
    hard_times: "Stephen's dialect marks exclusion from the discourse able to name his oppression.",
    atonement: "Robbie is pre-read as 'the son of a cleaner' before he can speak.",
    divergence: "Dickens externalises class through visible markers; McEwan internalises it as instinctive perception.",
    themes: ["class", "power", "suffering"],
  },
  {
    id: "cmx_imag_child",
    axis: "Imagining children",
    hard_times: "Sissy's fancy as moral oxygen against Gradgrindian Fact.",
    atonement: "Briony's orderly spirit as imagination weaponised by class privilege.",
    divergence: "Fancy liberates the suppressed Hands child but blinds the privileged Tallis child.",
    themes: ["imagination", "childhood", "truth"],
  },
  {
    id: "cmx_repair",
    axis: "Models of repair",
    hard_times: "Gradgrind's late kneeling: chastened recognition, partial reform.",
    atonement: "Briony's 'the attempt was all': repair as permanent labour without arrival.",
    divergence: "Dickens permits qualified repair; McEwan denies the catharsis of completion.",
    themes: ["guilt", "endings", "love"],
  },
  {
    id: "cmx_authority",
    axis: "Narrative authority",
    hard_times: "Intrusive narrator delivering moral verdicts on Coketown.",
    atonement: "Briony as author exposing the very right to tell as ethically suspect.",
    divergence: "Dickens claims authority on truth's behalf; McEwan exposes that claim as part of the problem.",
    themes: ["narrative_authority", "truth", "guilt"],
  },
  {
    id: "cmx_women_silence",
    axis: "Women and silence",
    hard_times: "Louisa's near-mute interior life under Gradgrindian Fact.",
    atonement: "Lola's silence after the assault, sustained across decades by class and marriage.",
    divergence: "Interior silence (Dickens) vs structural silencing (McEwan).",
    themes: ["gender", "guilt", "power", "suffering"],
  },
  {
    id: "cmx_systems",
    axis: "Naturalised systems",
    hard_times: "Coketown's smoke and the schoolroom's geometry as visible architecture of power.",
    atonement: "Tallis manners and the wartime apparatus as the grammar of perception itself.",
    divergence: "External architecture (Dickens) vs internalised etiquette (McEwan).",
    themes: ["power", "class", "suffering"],
  },
  {
    id: "cmx_endings",
    axis: "Endings and consolation",
    hard_times: "Chastened futures and persistent damage; consolation permitted but qualified.",
    atonement: "Happy reunion granted, then exposed as authored fiction.",
    divergence: "Dickens permits consolation; McEwan grants it only to expose it.",
    themes: ["endings", "guilt", "truth", "narrative_authority"],
  },
];
