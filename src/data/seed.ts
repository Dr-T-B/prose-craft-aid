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

  // GUILT
  { id: "q_guilt_1", family: "guilt", stem: "Compare the ways the writers present guilt and the desire for repair in Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["metafiction", "structural turn", "interior monologue"], level_tag: "top_band" },
  { id: "q_guilt_2", family: "guilt", stem: "Explore how far guilt is shown to be productive in Hard Times and Atonement.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_faulty_formation", likely_core_methods: ["free indirect discourse", "symbol"], level_tag: "strong" },

  // TRUTH
  { id: "q_truth_1", family: "truth", stem: "Compare how the writers explore the relationship between fiction and truth in Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["metafiction", "narrator unreliability", "imagery"], level_tag: "top_band" },
  { id: "q_truth_2", family: "truth", stem: "‘Both novels distrust their own storytelling.’ Discuss in relation to Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_guilt_repair", likely_core_methods: ["metafiction", "framing", "intrusive narrator"], level_tag: "top_band" },

  // IMAGINATION
  { id: "q_imag_1", family: "imagination", stem: "Compare the writers’ presentation of imagination as a moral force in Hard Times and Atonement.", primary_route_id: "r_imagination_rationality", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["symbol", "metaphor", "free indirect discourse"], level_tag: "strong" },
  { id: "q_imag_2", family: "imagination", stem: "Explore how the writers present the dangers of imagination in Hard Times and Atonement.", primary_route_id: "r_imagination_rationality", secondary_route_id: "r_faulty_formation", likely_core_methods: ["narrator unreliability", "perspective"], level_tag: "top_band" },

  // CHILDHOOD
  { id: "q_child_1", family: "childhood", stem: "Compare how the writers present the formation — and deformation — of children in Hard Times and Atonement.", primary_route_id: "r_faulty_formation", secondary_route_id: "r_systems", likely_core_methods: ["interior monologue", "symbol", "education imagery"], level_tag: "top_band" },
  { id: "q_child_2", family: "childhood", stem: "‘Childhood in both novels is a site of damage.’ Discuss.", primary_route_id: "r_faulty_formation", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["symbol", "free indirect discourse"], level_tag: "strong" },

  // LOVE
  { id: "q_love_1", family: "love", stem: "Compare how love is shown to be shaped — or thwarted — by social forces in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_gender_agency", likely_core_methods: ["dialogue", "symbol", "free indirect discourse"], level_tag: "strong" },

  // GENDER
  { id: "q_gender_1", family: "gender", stem: "Compare how the writers present women’s agency in Hard Times and Atonement.", primary_route_id: "r_gender_agency", secondary_route_id: "r_systems", likely_core_methods: ["interior monologue", "perspective", "silence"], level_tag: "strong" },

  // SUFFERING
  { id: "q_suffer_1", family: "suffering", stem: "Compare the presentation of suffering and its causes in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "industrial imagery", "war imagery"], level_tag: "strong" },

  // POWER
  { id: "q_power_1", family: "power", stem: "Compare how the writers present the power of institutions over individuals in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_class_mechanism", likely_core_methods: ["symbol", "perspective", "naming"], level_tag: "top_band" },

  // ENDINGS
  { id: "q_end_1", family: "endings", stem: "Compare the endings of Hard Times and Atonement and what they suggest about the possibility of repair.", primary_route_id: "r_guilt_repair", secondary_route_id: "r_storytelling_truth", likely_core_methods: ["metafiction", "structural framing", "tone"], level_tag: "top_band" },

  // NARRATIVE AUTHORITY
  { id: "q_narr_1", family: "narrative_authority", stem: "Compare the writers’ use of narrative authority in Hard Times and Atonement.", primary_route_id: "r_storytelling_truth", secondary_route_id: "r_imagination_rationality", likely_core_methods: ["intrusive narrator", "metafiction", "free indirect discourse"], level_tag: "top_band" },

  // WAR / INDUSTRIALISM
  { id: "q_war_1", family: "war_industrialism", stem: "Compare how the writers present the violence of industry and of war in Hard Times and Atonement.", primary_route_id: "r_systems", secondary_route_id: "r_suffering" as any, likely_core_methods: ["symbol", "industrial imagery", "war imagery"], level_tag: "strong" },
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

  // TRUTH
  PJ("pj_truth_fiction", "truth", "r_storytelling_truth", "Fiction as antidote vs fiction as displacement",
    "Sleary’s circus and 'people muth be amuthed': fiction as moral oxygen.",
    "Briony’s line that 'the truth had become as ghostly as invention'.",
    "Dickens trusts story to redeem; McEwan suspects it of replacing the truth it claims to repair.",
    "Which novel’s view of fiction is more persuasive?"),

  // IMAGINATION
  PJ("pj_imag_double", "imagination", "r_imagination_rationality", "Imagination as oxygen vs imagination as authority",
    "Sissy’s 'fancy' and the horse-rider’s daughter: imagination as moral capacity.",
    "Briony’s authorial 'orderly spirit' that misreads Robbie and Cecilia at the fountain.",
    "Imagination liberates the suppressed Hands child but blinds the privileged Tallis child.",
    "What conditions decide whether imagination heals or harms?"),

  // CHILDHOOD
  PJ("pj_child_formation", "childhood", "r_faulty_formation", "Children formed by an adult idea",
    "Louisa staring into the fire: 'a fire with nothing to burn'.",
    "Briony at thirteen, ‘determined to write’: the child as junior author.",
    "Hard Times shows imagination starved out; Atonement shows it overfed and ungoverned.",
    "Which is more dangerous: the suppressed imagination or the unchecked one?"),
];

/* ---------------- QUOTE METHODS ---------------- */
const Q = (
  id: string, source_text: SourceText, quote_text: string, method: string,
  best_themes: QuestionFamily[], effect_prompt: string, meaning_prompt: string, level_tag: Level
): QuoteMethod => ({ id, source_text, quote_text, method, best_themes, effect_prompt, meaning_prompt, level_tag });

export const QUOTE_METHODS: QuoteMethod[] = [
  // HARD TIMES
  Q("qm_facts", "Hard Times", "Now, what I want is, Facts.", "imperative + abstract noun capitalised as proper noun",
    ["truth", "imagination", "childhood", "power"],
    "The capital F reifies an ideology into a deity; the imperative grammar enacts its coercion.",
    "Dickens makes Fact the antagonist of the entire novel in its opening sentence.", "strong"),
  Q("qm_girl20", "Hard Times", "Girl number twenty", "depersonalising numeric address",
    ["childhood", "class", "power", "gender"],
    "Sissy is reduced to an integer in a register; the system speaks first, the person never.",
    "The school converts persons into units of measurable Fact.", "strong"),
  Q("qm_hands", "Hard Times", "the Hands", "synecdoche",
    ["class", "suffering", "power"],
    "Workers are named only by the body part the system needs from them.",
    "Class oppression is inscribed in the very vocabulary the novel inherits.", "secure"),
  Q("qm_serpents", "Hard Times", "interminable serpents of smoke", "biblical allusion + endless modifier",
    ["war_industrialism", "suffering", "power"],
    "The Edenic serpent rewritten as industrial pollution; ‘interminable’ refuses any redemptive ending.",
    "Industry is figured as a fallen, repeating sin without exit.", "top_band"),
  Q("qm_fire", "Hard Times", "a fire with nothing to burn", "metaphor of starved interiority",
    ["childhood", "imagination", "gender"],
    "Louisa’s inner life is figured as combustion without fuel — desire without object.",
    "Gradgrindian education has emptied the imagination it was meant to discipline.", "top_band"),
  Q("qm_truth_real", "Hard Times", "the simple truth that other people are as real as you", "moral aphorism",
    ["truth", "imagination", "guilt"],
    "Dickens locates ethics in the imaginative recognition of others as real.",
    "Imagination is presented not as decoration but as the precondition for moral life.", "top_band"),

  // ATONEMENT
  Q("qm_alive", "Atonement", "Was everyone else really as alive as she was?", "free indirect interrogative",
    ["imagination", "narrative_authority", "guilt"],
    "Briony's narrative power begins in solipsism that has not yet recognised other minds.",
    "The novel locates the seed of her later harm in this failure of imaginative reciprocity.", "top_band"),
  Q("qm_cleaner", "Atonement", "the son of a cleaner", "class-marked epithet inside free indirect discourse",
    ["class", "guilt", "power"],
    "Class assumption is smuggled into perception itself; the phrase pre-decides Robbie’s guilt.",
    "McEwan exposes how class operates as an invisible interpretive frame.", "top_band"),
  Q("qm_ghostly", "Atonement", "The truth had become as ghostly as invention", "simile collapsing the truth/fiction binary",
    ["truth", "narrative_authority", "guilt"],
    "Truth and fiction are made indistinguishable, undermining the consoling power of story.",
    "Atonement turns the realist confidence in narration against itself.", "top_band"),
  Q("qm_atonement", "Atonement", "How can a novelist achieve atonement…?", "rhetorical question by intrusive author-figure",
    ["guilt", "narrative_authority", "endings"],
    "The novel breaks frame to ask whether its own form is morally adequate.",
    "Metafiction is used as ethical interrogation, not stylistic play.", "top_band"),

  // COMPARATIVE
  Q("qm_cmp_voice", "Comparative", "Stephen’s ‘’Tis a muddle’ // Robbie’s ‘son of a cleaner’", "voiceless figures defined from outside",
    ["class", "power", "suffering"],
    "Both novels make their wronged men inarticulate within the discourse of their accusers.",
    "Class injustice in both texts works by deciding who gets to speak as a self.", "strong"),
  Q("qm_cmp_imag", "Comparative", "Sissy’s ‘fancy’ // Briony’s ‘orderly spirit’", "twin presentations of the imagining child",
    ["imagination", "childhood", "truth"],
    "Dickens and McEwan stage opposite verdicts on the moral status of childhood imagination.",
    "Together the texts refuse a single answer about whether imagination saves or destroys.", "top_band"),
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
  A5("ao5_narr_authority", "Narrative authority",
    "Both novels use their narrators to deliver moral verdicts on the worlds they describe.",
    "Atonement undermines this very authority, forcing the reader to question who has the right to tell.",
    "Where Dickens’s narrator claims moral authority, McEwan’s narrator interrogates it.",
    ["narrative_authority", "truth", "guilt", "endings"], "top_band"),
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
}
export const CHARACTERS: CharacterEntry[] = [
  { id: "c_louisa", source_text: "Hard Times", name: "Louisa Gradgrind", one_line: "Daughter raised on Fact; the novel's interior cost of Utilitarianism.", themes: ["childhood", "gender", "imagination", "suffering"] },
  { id: "c_tom", source_text: "Hard Times", name: "Tom Gradgrind", one_line: "Whelp; the moral failure of an emotionally starved upbringing.", themes: ["childhood", "guilt", "class"] },
  { id: "c_gradgrind", source_text: "Hard Times", name: "Thomas Gradgrind", one_line: "The man of Fact, chastened only when his system breaks his own family.", themes: ["power", "guilt", "imagination"] },
  { id: "c_stephen", source_text: "Hard Times", name: "Stephen Blackpool", one_line: "The silenced Hand whose dialect itself marks his exclusion.", themes: ["class", "suffering", "power"] },
  { id: "c_sissy", source_text: "Hard Times", name: "Sissy Jupe", one_line: "The horse-rider's daughter who carries 'fancy' as moral knowledge.", themes: ["imagination", "childhood", "love"] },
  { id: "c_bounderby", source_text: "Hard Times", name: "Josiah Bounderby", one_line: "Self-mythologising bully; the bourgeois lie about self-making.", themes: ["class", "power", "truth"] },
  { id: "c_briony", source_text: "Atonement", name: "Briony Tallis", one_line: "Author of the wrong and of its lifelong narration.", themes: ["guilt", "imagination", "narrative_authority", "childhood"] },
  { id: "c_robbie", source_text: "Atonement", name: "Robbie Turner", one_line: "‘The son of a cleaner’ whose class makes him pre-readable as guilty.", themes: ["class", "guilt", "love", "war_industrialism"] },
  { id: "c_cecilia", source_text: "Atonement", name: "Cecilia Tallis", one_line: "The defying sister; love as refusal of the family order.", themes: ["love", "gender", "class"] },
  { id: "c_lola", source_text: "Atonement", name: "Lola Quincey", one_line: "The silenced victim whose silence the novel tracks across decades.", themes: ["gender", "guilt", "power"] },
  { id: "c_marshall", source_text: "Atonement", name: "Paul Marshall", one_line: "The protected predator; class as structural impunity.", themes: ["class", "power", "guilt"] },
];

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
