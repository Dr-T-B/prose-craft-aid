-- ============================================================================
-- Seed: thematic_axis_pairing layer — v2
-- Source: comparative_mix Google Sheet (cm_001–cm_020)
-- Schema: reconciled toward migration_thematic_axis.sql
--   ao5_tension -> critical_perspectives (AO5 not assessed in Component 2)
--   student_sentence_stem -> sentence_components jsonb chip-rail (anti-pattern removed)
--   cm_NNN ids -> descriptive slugs
-- All 20 axes from the sheet included.
-- Idempotent: ON CONFLICT DO NOTHING throughout.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AXIS CLUSTERS (8 rows)
-- ============================================================================

INSERT INTO axis_clusters (id, name, description, sort_order) VALUES
  ('c1', 'Childhood, education, innocence',
   'Covers childhood, education, family, emotional formation, and adult-child relationships.',
   1),
  ('c2', 'Truth, lies, narrative control',
   'Covers narrative authority, truth, voice, silencing, and who controls the account.',
   2),
  ('c3', 'Class, industry, social order',
   'Covers class hierarchy, social critique, setting as moral landscape, and social performance.',
   3),
  ('c4', 'Gender, patriarchy, sexuality',
   'Covers female agency, desire, sexuality, marriage, and gender constraints.',
   4),
  ('c5', 'Guilt, atonement, responsibility',
   'Covers guilt, moral consequence, justice, endings, and the secular versus moral frameworks of repair.',
   5),
  ('c6', 'War, violence, trauma',
   'Covers industrialism and war as systems of mechanised suffering, and work as human cost.',
   6),
  ('c7', 'Imagination, art, ethics',
   'Covers imagination, fancy, moral imagination, and fiction as ethical instrument.',
   7),
  ('c8', 'Time, structure, memory',
   'Covers structure, consequence, memory, and retrospection.',
   8)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 2. THEMATIC AXIS PAIRINGS (20 rows from comparative_mix sheet)
-- ============================================================================

-- c1_innocence_misinterpretation | Innocence as damaged perception
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c1_innocence_misinterpretation',
  'Innocence as damaged perception',
  'c1',
  'Innocence and Misinterpretation',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents innocence as damaged by utilitarian education especially through Louisa and Tom whose emotional and moral perception is distorted by Gradgrind''s philosophy.',
  'McEwan presents innocence as unstable and dangerous because Briony''s childish imagination misreads adult behaviour and produces catastrophic consequences.',
  'Dickens foregrounds systemic damage caused by education and ideology whereas McEwan foregrounds individual misinterpretation shaped by class imagination and narrative authority.',
  'Both novels suggest that innocence is not pure or harmless; it can be shaped by social systems, education, class and narrative habits into moral blindness.',
  ARRAY['satire', 'caricature', 'third-person moral commentary', 'symbolic contrast', 'biblical structure']::text[],
  ARRAY['focalisation', 'free indirect discourse', 'delayed revelation', 'metafiction', 'symbolism']::text[],
  ARRAY['Victorian utilitarianism', 'industrial education', 'Gradgrindian rationalism', 'Victorian moral didacticism']::text[],
  ARRAY['1930s class hierarchy', 'child psychology', 'interwar social codes', 'postmodern retrospective narration']::text[],
  'Systemic miseducation versus individual misreading.',
  ARRAY['Briony can be read as morally guilty but also as a child shaped by class codes and literary conventions', 'Louisa can be read as victim but also as morally underdeveloped by education.']::text[],
  ARRAY['Compare the ways writers present innocence', 'Compare the significance of misunderstanding', 'Compare the ways writers present childhood', 'Compare the effects of mistaken judgement']::text[],
  ARRAY['Bk 1 Ch 1-2 (Gradgrind''''s schoolroom)', 'Bk 1 Ch 3 (Louisa as a child)', 'Bk 2 Ch 12 (Louisa''''s collapse)']::text[],
  ARRAY['Pt 1 Ch 1 (Briony''''s writing room)', 'Pt 1 Ch 13 (the accusation)', 'Pt 4 (1999, the disclosure)']::text[],
  'Both writers show that young people misunderstand the world but Dickens blames education while McEwan focuses on Briony''''s imagination and the narrative authority she assumes.',
  'Both texts expose innocence as a constructed and unreliable state: Dickens externalises its corruption through utilitarian social systems while McEwan internalises it through focalised narrative consciousness and retrospective guilt.',
  '{"verbs": ["externalises through system", "internalises through consciousness", "exposes as constructed", "positions as morally unstable"], "connectives": ["whereas Dickens locates the failure in ideology, McEwan locates it in individual perception", "both texts expose innocence as unreliable but differ in where they place that unreliability", "in contrast to the systemic critique of Dickens, McEwan examines"], "counter_positions": ["Briony may be read as morally guilty or as shaped by class conventions \u2014 the text sustains both readings", "Louisa''''s passivity can be read as victimhood or as the consequence of a moral underdevelopment that the novel partly holds her responsible for"]}'::jsonb,
  'Foundation axis — almost any question on childhood or moral perception can be refracted through this comparative frame.',
  1
)
ON CONFLICT (slug) DO NOTHING;

-- c3_class_social_hierarchy | Class as an organising system of power
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c3_class_social_hierarchy',
  'Class as an organising system of power',
  'c3',
  'Class and Social Hierarchy',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents class through industrial capitalism, Coketown, Bounderby''s self-mythology and the exploitation of workers such as Stephen Blackpool.',
  'McEwan presents class through the Tallis household, Robbie''s precarious social mobility, Cecilia''s rebellion and Briony''s class-inflected misreading of events.',
  'Dickens attacks industrial class inequality as a public social structure whereas McEwan exposes class as a subtler but equally destructive system of cultural assumption and social coding.',
  'Both novels show class as a structure that determines whose voice is trusted, whose suffering is visible, and whose truth is believed.',
  ARRAY['industrial imagery', 'satire', 'symbolic setting', 'contrast', 'character construction']::text[],
  ARRAY['country-house setting', 'focalisation', 'social detail', 'dialogue', 'retrospective irony']::text[],
  ARRAY['industrial capitalism', 'Victorian class hierarchy', 'factory labour', 'laissez-faire economics']::text[],
  ARRAY['1930s upper-middle-class privilege', 'Cambridge education', 'servant/employer hierarchy', 'interwar class codes']::text[],
  'Public industrial exploitation versus private domestic hierarchy.',
  ARRAY['Robbie may be read as a victim of class prejudice but also as someone whose education makes him socially liminal and therefore threatening to the Tallis household.']::text[],
  ARRAY['Compare the ways writers present class', 'Compare social inequality', 'Compare power and status', 'Compare the treatment of working-class characters']::text[],
  ARRAY['Bk 1 Ch 5 (Coketown: The Key-note)', 'Bk 1 Ch 11 (Stephen at Bounderby''''s)', 'Bk 3 Ch 5 (Bounderby''''s exposure)']::text[],
  ARRAY['Pt 1 Ch 2 (Cecilia and Robbie at the fountain)', 'Pt 1 Ch 13 (the accusation — class as credibility)', 'Pt 4 (the Marshalls'''' survival)']::text[],
  'Both texts show class inequality but Dickens focuses on workers and factories while McEwan focuses on the assumptions inside a wealthy family that determine who is believed.',
  'Dickens and McEwan both expose class as epistemological power: class determines not only status but credibility, interpretation and narrative authority — whose account a society will accept.',
  '{"verbs": ["exposes class as epistemological", "makes class visible through", "treats credibility as class-determined", "locates authority in"], "connectives": ["Dickens makes class visible through industry; McEwan makes it visible through domestic assumption", "both novelists expose class as a structure of credibility, but differ in their method", "where Dickens attacks through satire, McEwan exposes through focalisation"], "counter_positions": ["Robbie may be read as purely victimised or as socially liminal in a way that makes him threatening \u2014 the novel sustains both", "Bounderby''''s myth could be read as individual fraud or as a revelation of how class ideology reproduces itself through self-narration"]}'::jsonb,
  'Underlies almost all other axes — class is the silent operator in female relationships, marriage, voice, and justice questions.',
  2
)
ON CONFLICT (slug) DO NOTHING;

-- c1_education_formation | Education as moral formation or deformation
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c1_education_formation',
  'Education as moral formation or deformation',
  'c1',
  'Education and Formation',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens criticises Gradgrind''s fact-based education for suppressing imagination, emotional intelligence and moral sympathy.',
  'McEwan presents Briony''s literary education and imaginative habits as powerful but morally hazardous because they encourage aesthetic pattern-making before ethical understanding.',
  'Dickens attacks formal education as mechanised social conditioning while McEwan interrogates literary imagination as both creative gift and ethical danger.',
  'Both novels question whether education produces wisdom or merely trains perception into narrow, damaging habits.',
  ARRAY['repetition', 'caricature', 'semantic field of fact', 'satire', 'symbolic naming']::text[],
  ARRAY['metafiction', 'intertextuality', 'focalisation', 'narrative framing', 'irony']::text[],
  ARRAY['utilitarian education', 'Victorian schooling debates', 'industrial discipline', 'Dickensian social reform']::text[],
  ARRAY['literary culture', 'child authorship', 'modernist and postmodernist fiction', 'class education']::text[],
  'Formal rational schooling versus imaginative literary self-education.',
  ARRAY['Briony''''s imagination can be condemned as irresponsible but the novel also depends on that imagination to construct atonement.']::text[],
  ARRAY['Compare education', 'Compare imagination and learning', 'Compare the effects of childhood training', 'Compare rationality and imagination']::text[],
  ARRAY['Bk 1 Ch 1 (Now, what I want is, Facts)', 'Bk 1 Ch 2 (Sissy and Bitzer)', 'Bk 3 Ch 8 (Bitzer at the door)']::text[],
  ARRAY['Pt 1 Ch 1 (Briony''''s writing room and the play)', 'Pt 1 Ch 10 (the library — genre misreading)', 'Pt 4 (the elderly author''''s verdict)']::text[],
  'Both texts treat education as shaping moral perception: Dickens condemns education without imagination while McEwan scrutinises imagination without ethical maturity.',
  'Both texts treat education as a discipline of perception: Dickens condemns education without imagination while McEwan scrutinises imagination without ethical maturity — making both systems equally dangerous in different registers.',
  '{"verbs": ["condemns education that suppresses", "scrutinises imagination that precedes ethics", "treats schooling as", "makes perception the product of"], "connectives": ["Dickens condemns the curriculum; McEwan interrogates the canon", "both texts make education a discipline of perception, though the disciplines differ", "where Gradgrind''''s school produces Bitzer, Briony''''s reading produces"], "counter_positions": ["Briony''''s imagination can be condemned as irresponsible or valued as the only means through which atonement is possible", "Gradgrind may be read as villainous or as sincerely mistaken within the ideological limits of his moment"]}'::jsonb,
  'Pair with Imagination (cm_004/c7_imagination_rationality) — together they form a dialectic on what education can and cannot provide.',
  3
)
ON CONFLICT (slug) DO NOTHING;

-- c7_imagination_rationality | Fact and fiction as competing moral systems
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c7_imagination_rationality',
  'Fact and fiction as competing moral systems',
  'c7',
  'Imagination versus Rationality',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens opposes Gradgrind''s cult of Fact to fancy, sympathy and moral imagination, presenting rationalism as spiritually destructive when detached from feeling.',
  'McEwan presents fiction as both damaging and reparative: Briony''s imagination causes harm but her later fiction attempts moral restitution.',
  'Dickens largely defends imagination against utilitarian fact while McEwan complicates imagination by making fiction both the source of error and the medium of atonement.',
  'Both novels explore the ethical consequences of how humans construct reality, whether through rigid fact or imaginative narrative.',
  ARRAY['capitalisation of Fact', 'satire', 'symbolic opposition', 'character contrast', 'didactic narrator']::text[],
  ARRAY['metafiction', 'unreliable narration', 'delayed disclosure', 'free indirect discourse', 'symbolism']::text[],
  ARRAY['utilitarianism', 'Victorian industrial rationalism', 'educational reform', 'anti-mechanistic humanism']::text[],
  ARRAY['postmodern fiction', 'narrative ethics', 'wartime memory', 'late twentieth-century literary self-consciousness']::text[],
  'Anti-utilitarian defence of fancy versus postmodern critique of fiction as morally ambivalent.',
  ARRAY['Fiction in Atonement may be seen as inadequate compensation but also as the only remaining form of moral witness.']::text[],
  ARRAY['Compare imagination and rationality', 'Compare fact and fiction', 'Compare the role of storytelling', 'Compare moral imagination']::text[],
  ARRAY['Bk 1 Ch 6 (the circus people — Fancy)', 'Bk 1 Ch 8 (Louisa''''s wondering at the fire)', 'Bk 3 Ch 8 (Sleary''''s farewell speech)']::text[],
  ARRAY['Pt 1 Ch 1 (Briony''''s play and writing room)', 'Pt 1 Ch 13 (the accusation as fiction)', 'Pt 4 (the metafictional epilogue)']::text[],
  'Dickens suggests imagination is good and facts alone are harmful while McEwan shows imagination can cause both harm and healing.',
  'Dickens constructs imagination as an ethical corrective to mechanised rationalism whereas McEwan presents fiction as morally ambivalent: capable of both violation and repair — making the capacity to imagine at once the novel''''s problem and its solution.',
  '{"verbs": ["defends fancy as corrective", "exposes fiction as morally ambivalent", "presents imagination as", "treats storytelling as"], "connectives": ["Dickens defends imagination; McEwan prosecutes it", "both novels place imagination at the moral centre but reach opposed verdicts", "where Dickens'''' circus offers redemption through fancy, McEwan''''s novel-within-a-novel"], "counter_positions": ["Fiction in Atonement may be inadequate compensation or the only available form of moral witness \u2014 the text sustains both", "Sleary''''s defence of fancy could be read as an answer Briony fails to give, or as exactly the self-justifying rhetoric McEwan distrusts"]}'::jsonb,
  'Highest-yield AO2 axis for Level 5: Dickens and McEwan''''s opposed positions on imagination constitute a genuine literary-ethical disagreement.',
  4
)
ON CONFLICT (slug) DO NOTHING;

-- c5_guilt_responsibility | Responsibility after harm has been done
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c5_guilt_responsibility',
  'Responsibility after harm has been done',
  'c5',
  'Guilt and Responsibility',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents responsibility as social and moral: Gradgrind must recognise his failure, Bounderby refuses responsibility and society neglects Stephen.',
  'McEwan presents guilt through Briony''s lifelong attempt to understand and symbolically repair the harm caused by her accusation.',
  'Dickens uses moral conversion and social critique while McEwan offers unresolved retrospective guilt in which narrative repair cannot undo actual damage.',
  'Both novels examine whether wrongdoing can be acknowledged, repaired or only narrated after irreversible damage.',
  ARRAY['moral commentary', 'character contrast', 'plot retribution', 'sentimental realism', 'symbolic structure']::text[],
  ARRAY['retrospective narration', 'metafiction', 'confession', 'temporal fragmentation', 'irony']::text[],
  ARRAY['Victorian moral responsibility', 'Christian ethics', 'industrial reform', 'social conscience']::text[],
  ARRAY['postwar guilt', 'legal injustice', 'trauma memory', 'late twentieth-century ethics of representation']::text[],
  'Social responsibility that is potentially reformative versus retrospective personal guilt that cannot reverse historical loss.',
  ARRAY['Briony''''s atonement may be sincere but the novel questions whether aesthetic compensation can ever equal moral repair.']::text[],
  ARRAY['Compare guilt', 'Compare responsibility', 'Compare moral consequence', 'Compare attempts to repair harm']::text[],
  ARRAY['Bk 3 Ch 1 (Gradgrind''''s recognition)', 'Bk 3 Ch 5 (Bounderby''''s exposure)', 'Bk 3 Ch 8 (Bitzer at the door)']::text[],
  ARRAY['Pt 3 (Briony''''s nursing as reparation)', 'Pt 4 (the disclosure, the withheld ending)', 'the title Atonement']::text[],
  'Both writers show guilt but Dickens gives some characters a chance to change while McEwan makes guilt permanent and impossible to resolve through fiction.',
  'Dickens imagines responsibility as potentially reformative whereas McEwan presents guilt as belated, aestheticised and incapable of reversing historical loss — staging an evaluative disagreement about what fiction can and cannot do.',
  '{"verbs": ["imagines responsibility as reformative", "stages guilt as irreversible", "treats wrongdoing as", "presents moral consequence as"], "connectives": ["Dickens allows the possibility of reform; McEwan does not", "both texts stage moral consequence but differ in whether narrative can settle it", "where Gradgrind''''s recognition scene closes an account, Briony''''s epilogue opens one it cannot close"], "counter_positions": ["Briony''''s atonement may be sincere or another act of authorial control \u2014 the novel refuses to distinguish", "Gradgrind''''s recognition could be read as genuine change or as sentimentalism that the novel''''s political critique undercuts"]}'::jsonb,
  'Highest-altitude evaluative axis — the closing move of almost any Level 5 essay on guilt, consequence, or endings.',
  5
)
ON CONFLICT (slug) DO NOTHING;

-- c2_truth_narrative_authority | Who controls truth?
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c2_truth_narrative_authority',
  'Who controls truth?',
  'c2',
  'Truth and Narrative Authority',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens uses an overt moral narrator who guides judgement and exposes falsehoods such as Bounderby''s self-made myth.',
  'McEwan destabilises truth through focalisation, delayed revelation and Briony''s final authorial disclosure.',
  'Dickens generally asserts moral truth through narrative authority whereas McEwan makes narrative authority itself ethically suspect.',
  'Both novels ask how truth is constructed but differ in whether narrative can confidently expose or only partially reconstruct it.',
  ARRAY['omniscient narration', 'satire', 'irony', 'moral commentary', 'revelatory structure']::text[],
  ARRAY['focalisation', 'unreliable narration', 'metafiction', 'temporal shift', 'delayed revelation']::text[],
  ARRAY['Victorian realism', 'serial fiction', 'moral didacticism', 'social-problem novel']::text[],
  ARRAY['postmodern narrative', 'historical fiction', 'memory studies', 'ethics of authorship']::text[],
  'Moral exposure through confident narration versus epistemological uncertainty through suspect narration.',
  ARRAY['Briony may be seen as confessing truth or manipulating readers by controlling the final version of events.']::text[],
  ARRAY['Compare truth', 'Compare narrative voice', 'Compare storytelling', 'Compare lies and self-deception']::text[],
  ARRAY['Bk 1 Ch 1 (Now, what I want is, Facts — the narrator''''s stance)', 'Bk 1 Ch 5 (the Coketown set-piece)', 'Bk 3 Ch 9 (the narrator''''s closing apostrophe)']::text[],
  ARRAY['Pt 1 Ch 1-2 (the fountain seen twice)', 'Pt 1 Ch 7 (Briony''''s view)', 'Pt 4 (the metafictional disclosure)']::text[],
  'Dickens gives us a clear narrator while McEwan makes us question the narrator — both choices are deliberate ethical positions about what fiction can claim.',
  'Dickens positions narration as a vehicle of moral correction while McEwan converts narration into the central ethical problem of the novel — delivering judgement on the reader''''s desire for clarity rather than to it.',
  '{"verbs": ["positions narration as moral vehicle", "converts narration into ethical problem", "asserts truth through", "destabilises truth via"], "connectives": ["Dickens delivers judgement to the reader; McEwan delivers judgement on the reader", "both use narrative authority as their central instrument, but to opposed ends", "where Dickens'''' narrator names what is true, McEwan''''s narrator"], "counter_positions": ["Briony may be confessing or controlling \u2014 the epilogue sustains both readings", "Dickens'''' moral narrator could be read as ideologically confident or as a performance of certainty the plot itself qualifies"]}'::jsonb,
  'Strongest AO2 axis in the dataset — pairs naturally with Structure (cm_013) and Memory (cm_016).',
  6
)
ON CONFLICT (slug) DO NOTHING;

-- c4_women_agency | Female agency under constraint
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c4_women_agency',
  'Female agency under constraint',
  'c4',
  'Women and Agency',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents Louisa and Sissy as contrasting models of femininity shaped by education, class and emotional expression.',
  'McEwan presents Cecilia and Briony as women negotiating class expectation, sexual knowledge, guilt and authorship.',
  'Dickens critiques the denial of emotional development to women within Victorian patriarchy while McEwan explores female agency through desire, authorship and retrospective control.',
  'Both novels show women constrained by social expectations but also capable of resistance, reinterpretation or moral influence.',
  ARRAY['contrast', 'sentimental realism', 'symbolism', 'dialogue', 'character foil']::text[],
  ARRAY['focalisation', 'sensuous imagery', 'metafiction', 'interior consciousness', 'retrospective narration']::text[],
  ARRAY['Victorian separate spheres', 'patriarchal family', 'female education', 'marriage expectations']::text[],
  ARRAY['1930s gender codes', 'female sexuality', 'wartime nursing', 'women writers']::text[],
  'Victorian emotional repression versus modern narrative agency.',
  ARRAY['Louisa may be read as victim of patriarchy but also as a critique of emotional passivity', 'Briony may be read as empowered author or manipulative controller of others'''' stories.']::text[],
  ARRAY['Compare women', 'Compare female agency', 'Compare gender expectations', 'Compare family and power']::text[],
  ARRAY['Bk 1 Ch 3 (Louisa as a child)', 'Bk 1 Ch 14-15 (the marriage proposal)', 'Bk 2 Ch 12 (Louisa''''s flight)']::text[],
  ARRAY['Pt 1 Ch 2 (Cecilia at the fountain)', 'Pt 1 Ch 7 (Briony''''s view of Cecilia)', 'Pt 3 (Briony''''s nursing)']::text[],
  'Both texts show women limited by society but they respond differently — Louisa inward and restrained, Briony outward and authorial.',
  'Dickens presents female agency as morally corrective but constrained whereas McEwan complicates agency by linking it to desire, class, guilt and authorship — so that the woman who acts most freely does the most damage.',
  '{"verbs": ["constrains agency through doctrine", "complicates agency through authorship", "treats female experience as", "positions women''''s resistance as"], "connectives": ["Dickens constrains women through doctrine; McEwan constrains them through narrative position", "both texts show women as constrained but the nature of the constraint differs", "where Louisa''''s silence is imposed, Briony''''s voice is the problem"], "counter_positions": ["Louisa may be read as a victim of patriarchy or as morally passive in a way the novel partly holds her accountable for", "Briony as empowered author or as manipulative controller \u2014 the text does not resolve the ambiguity"]}'::jsonb,
  'Directly relevant to 2024 Q1 (female relationships) and 2022 Q2 (independence). Pair with Desire/Sexuality (cm_019) for marriage questions.',
  7
)
ON CONFLICT (slug) DO NOTHING;

-- c1_family_emotional_formation | The family as a site of damage or moral possibility
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c1_family_emotional_formation',
  'The family as a site of damage or moral possibility',
  'c1',
  'Family and Emotional Formation',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents the Gradgrind household as emotionally impoverished by the ideology of fact, while Sissy brings alternative warmth and sympathy.',
  'McEwan presents the Tallis family as emotionally distant, socially coded and unable to recognise the consequences of Briony''s accusation.',
  'Dickens contrasts defective family education with sentimental moral repair whereas McEwan presents family as complicit in silence, misreading and class protection.',
  'Both novels depict family as a formative institution that can either cultivate sympathy or reproduce emotional blindness.',
  ARRAY['domestic contrast', 'symbolic setting', 'sentimental structure', 'character foil', 'moral commentary']::text[],
  ARRAY['country-house setting', 'focalisation', 'dialogue gaps', 'symbolism', 'retrospective irony']::text[],
  ARRAY['Victorian domestic ideology', 'family as moral school', 'patriarchal authority']::text[],
  ARRAY['interwar upper-middle-class family', 'emotional restraint', 'family reputation', 'class protection']::text[],
  'Domestic moral education versus domestic complicity.',
  ARRAY['The Tallis family can be read as negligent rather than malicious', 'Gradgrind can be read as sincerely mistaken rather than cruel.']::text[],
  ARRAY['Compare family relationships', 'Compare parents and children', 'Compare emotional damage', 'Compare domestic life']::text[],
  ARRAY['Bk 1 Ch 3 (Stone Lodge)', 'Bk 1 Ch 14-15 (the marriage arrangement)', 'Bk 3 Ch 1 (Gradgrind''''s recognition)']::text[],
  ARRAY['Pt 1 Ch 6 (Emily Tallis upstairs)', 'Pt 1 Ch 11 (the family dinner)', 'Pt 1 Ch 13 (where were the adults?)']::text[],
  'Both novels show that families shape children and their values — Dickens through ideological damage, McEwan through the social silence that enables injustice.',
  'Dickens frames family as a site where ideology deforms feeling whereas McEwan frames family as a social system that protects status at the expense of justice — making family in both novels the origin of the novel''''s central harm.',
  '{"verbs": ["frames family as site of ideological damage", "presents family as complicit in", "uses the household to reveal", "positions parental authority as"], "connectives": ["Dickens frames family as a site of ideological damage; McEwan frames it as one of social complicity", "both texts make family the origin of their central harm, though the mechanism differs", "where Gradgrind actively deforms, the Tallis adults passively enable"], "counter_positions": ["The Tallis family may be negligent rather than malicious \u2014 the novel does not straightforwardly condemn them", "Gradgrind may be read as sincerely mistaken within the limits of his ideology rather than as deliberately cruel"]}'::jsonb,
  'Especially productive for questions on parents/children, siblings, and what families enable or prevent.',
  8
)
ON CONFLICT (slug) DO NOTHING;

-- c6_industrialism_war | Mechanised human suffering
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c6_industrialism_war',
  'Mechanised human suffering',
  'c6',
  'Industrialism and War',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents industrial Coketown as a dehumanising machine that reduces workers to ''Hands'' and lives to production.',
  'McEwan presents war, especially the Dunkirk section, as mechanised suffering in which individual bodies are absorbed by historical violence.',
  'Dickens critiques industrial capitalism in peacetime while McEwan extends mechanisation into twentieth-century warfare and mass trauma.',
  'Both novels present modern systems as capable of crushing individual life through impersonal forces.',
  ARRAY['industrial imagery', 'metaphor', 'symbolic setting', 'collective nouns', 'repetition']::text[],
  ARRAY['war imagery', 'fragmented structure', 'sensory detail', 'free indirect discourse', 'juxtaposition']::text[],
  ARRAY['Industrial Revolution', 'factory labour', 'Coketown', 'Victorian social reform']::text[],
  ARRAY['Second World War', 'Dunkirk retreat', 'wartime nursing', 'mechanised warfare']::text[],
  'Industrial mechanisation versus military mechanisation — different scales of the same systemic violence.',
  ARRAY['McEwan''''s war scenes may shift focus from Briony''''s guilt to wider historical suffering, complicating the novel''''s moral focus.']::text[],
  ARRAY['Compare suffering', 'Compare industrialism and war', 'Compare dehumanisation', 'Compare social systems']::text[],
  ARRAY['Bk 1 Ch 5 (Coketown: The Key-note)', 'Bk 1 Ch 11 (the factory)', 'Bk 3 Ch 6 (Stephen''''s death)']::text[],
  ARRAY['Pt 2 (Dunkirk — the road, the leg in the tree)', 'Pt 3 (St Thomas''''s Hospital)', 'Pt 4 (the disclosure of deaths)']::text[],
  'Dickens shows factories harming people while McEwan shows war harming people — both writers use these settings to expose systems that reduce people to bodies.',
  'Dickens and McEwan both present modernity as dehumanising but Dickens attacks economic machinery while McEwan exposes military and historical machinery — suggesting that the system that built Coketown also built Dunkirk.',
  '{"verbs": ["dehumanises through industrial machinery", "absorbs into historical violence", "reduces to", "exposes the impersonality of"], "connectives": ["Dickens attacks peacetime machinery; McEwan exposes wartime machinery", "both texts present bodies crushed by impersonal systems, but the systems differ in scale", "where Coketown''''s violence is slow and systemic, Dunkirk''''s is catastrophic and concentrated"], "counter_positions": ["McEwan''''s war scenes may shift the novel''''s focus from Briony''''s personal guilt to historical suffering \u2014 critics disagree about whether this enriches or dilutes the moral argument", "Dickens'''' industrial sublime may aestheticise the very suffering it critiques"]}'::jsonb,
  'Strong AO3 axis. The comparative claim ''''industrial Coketown and wartime Dunkirk are both systems that consume bodies'''' is a reliable Level 5 evaluative move.',
  9
)
ON CONFLICT (slug) DO NOTHING;

-- c2_power_voice | Silencing and credibility
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c2_power_voice',
  'Silencing and credibility',
  'c2',
  'Power and Voice',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents working-class voice as constrained through Stephen''s limited social power and the narrator''s mediation.',
  'McEwan presents Robbie''s voice as overruled by Briony''s accusation and the Tallis family''s class credibility.',
  'Dickens emphasises economic and institutional silencing whereas McEwan emphasises narrative, social and legal silencing.',
  'Both novels show that power operates by controlling whose account is heard, accepted or erased.',
  ARRAY['dialect', 'narratorial framing', 'contrast', 'courtroom-like moral judgement', 'characterisation']::text[],
  ARRAY['letters', 'focalisation', 'reported speech', 'narrative omission', 'legal discourse']::text[],
  ARRAY['Victorian class voice', 'industrial relations', 'law and poverty', 'Chartist anxieties']::text[],
  ARRAY['1930s class justice', 'policing', 'sexual morality', 'wartime records']::text[],
  'Economic institutional silencing versus narrative-legal silencing.',
  ARRAY['Stephen and Robbie can both be read as morally idealised victims which may simplify their social complexity.']::text[],
  ARRAY['Compare power', 'Compare voice', 'Compare silence', 'Compare injustice']::text[],
  ARRAY['Bk 1 Ch 11 (Stephen at Bounderby''''s)', 'Bk 2 Ch 4 (Stephen at Slackbridge''''s meeting)', 'Bk 3 Ch 6 (Stephen''''s death-bed speech)']::text[],
  ARRAY['Pt 1 Ch 8 (Robbie''''s letter)', 'Pt 1 Ch 13 (the accusation)', 'Pt 4 (Briony''''s retrospective account)']::text[],
  'Both writers show powerless people not being listened to — Dickens through economic exclusion, McEwan through narrative and legal authority.',
  'Dickens and McEwan connect power to voice: both show that injustice depends on whose narrative society authorises — making credibility itself a form of class power.',
  '{"verbs": ["authorises certain voices over others", "silences through institutional power", "makes credibility a function of class", "positions narration as a legal instrument"], "connectives": ["Dickens'''' silencing is economic; McEwan''''s is narrative and legal", "both texts show that injustice depends on whose account a society will credit", "where Stephen is silenced by poverty, Robbie is silenced by a child''''s testimony given class authority"], "counter_positions": ["Stephen and Robbie may be read as morally idealised victims \u2014 the texts'''' insistence on their goodness may simplify the social dynamics they''''re embedded in", "Briony''''s account may be read as a child''''s honest error or as a class-inflected act of narrative violence"]}'::jsonb,
  'Strong paired axis with Class (cm_002) — together they show that class is both economic and epistemic.',
  10
)
ON CONFLICT (slug) DO NOTHING;

-- c3_social_performance_identity | Constructed selves and false roles
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c3_social_performance_identity',
  'Constructed selves and false roles',
  'c3',
  'Social Performance and Identity',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens exposes Bounderby''s self-made-man identity as a fraudulent performance that protects capitalist authority.',
  'McEwan shows Briony constructing herself through literary roles and later through the role of penitent author.',
  'Dickens attacks public social performance as hypocrisy whereas McEwan explores identity as narratively constructed and ethically unstable.',
  'Both novels reveal identity as shaped by stories people tell about themselves and others.',
  ARRAY['satire', 'symbolic naming', 'dialogue', 'revelation', 'caricature']::text[],
  ARRAY['metafiction', 'focalisation', 'role-playing', 'intertextuality', 'retrospective narration']::text[],
  ARRAY['self-help myth', 'Victorian capitalism', 'respectability culture']::text[],
  ARRAY['literary role-play', 'upper-class codes', 'authorship', 'memory culture']::text[],
  'Public hypocrisy as fraud versus narrative self-fashioning as ethical instability.',
  ARRAY['Briony''''s final self-presentation as atoning author may be honest confession or another controlling performance.']::text[],
  ARRAY['Compare identity', 'Compare false appearances', 'Compare self-deception', 'Compare performance']::text[],
  ARRAY['Bk 1 Ch 4 (Bounderby''''s self-narration)', 'Bk 2 Ch 7 (Mrs Sparsit as social performer)', 'Bk 3 Ch 5 (Bounderby''''s exposure)']::text[],
  ARRAY['Pt 1 Ch 1 (Briony writing herself as author)', 'Pt 3 (Briony as nurse)', 'Pt 4 (Briony as elderly confessant)']::text[],
  'Both texts show characters creating versions of themselves — Dickens exposes this as hypocrisy through satire, McEwan explores it as an inescapable condition of selfhood.',
  'Dickens unmasks identity as social fraud while McEwan makes identity inseparable from narrative construction — so that what Dickens satirises as exceptional, McEwan presents as universal.',
  '{"verbs": ["unmasks identity as social fraud", "makes identity inseparable from narrative", "exposes performance as", "treats self-construction as"], "connectives": ["Dickens presents identity fraud as exceptional; McEwan presents it as inescapable", "both texts expose the gap between performed and actual self, but differ in their verdict on that gap", "where Bounderby''''s fraud is externally exposed, Briony''''s is internally sustained"], "counter_positions": ["Briony''''s final role as atoning author may be honest confession or the most controlled performance of all", "Bounderby''''s fraud may seem exceptional but the novel implies that Victorian capitalism depends on exactly this kind of self-mythology"]}'::jsonb,
  'Good axis for identity-focused questions. Bounderby''''s self-made mythology and Briony''''s authorial self-construction make a precise parallel.',
  11
)
ON CONFLICT (slug) DO NOTHING;

-- c7_moral_imagination | Sympathy as a condition of judgement
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c7_moral_imagination',
  'Sympathy as a condition of judgement',
  'c7',
  'Moral Imagination',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents sympathy and fancy as necessary to moral judgement, contrasting Sissy''s emotional intelligence with Gradgrind''s factual rigidity.',
  'McEwan presents moral imagination as necessary but dangerous: Briony fails because she imagines aesthetically rather than ethically.',
  'Dickens treats sympathy as corrective whereas McEwan insists that imagination must be disciplined by humility, truth and responsibility.',
  'Both novels argue that moral judgement requires the ability to imagine others accurately and compassionately.',
  ARRAY['contrast', 'sentimentality', 'moral commentary', 'symbolism', 'character foil']::text[],
  ARRAY['free indirect discourse', 'metafiction', 'irony', 'focalisation', 'symbolism']::text[],
  ARRAY['Victorian moral reform', 'Christian sympathy', 'anti-utilitarian humanism']::text[],
  ARRAY['postwar ethics', 'narrative responsibility', 'psychological realism', 'literary self-consciousness']::text[],
  'Sympathy as moral cure versus imagination as ethical risk.',
  ARRAY['Briony''''s imaginative failure may make the novel sceptical of literature itself even while using literature as atonement.']::text[],
  ARRAY['Compare sympathy', 'Compare moral judgement', 'Compare imagination', 'Compare understanding others']::text[],
  ARRAY['Bk 1 Ch 6 (Pegasus''''s Arms — the circus)', 'Bk 1 Ch 9 (Sissy''''s moral intelligence)', 'Bk 3 Ch 7-8 (Sleary''''s wisdom)']::text[],
  ARRAY['Pt 1 Ch 1 (Briony''''s juvenile authorship)', 'Pt 1 Ch 13 (the aesthetic certainty of the accusation)', 'Pt 4 (the question of whether writing is enough)']::text[],
  'Both writers show that people need sympathy and imagination to understand others — but Dickens presents imagination as reliably good while McEwan presents it as a capacity that can fail.',
  'Dickens idealises sympathetic imagination while McEwan subjects it to ethical scrutiny, making imagination both necessary and culpable — a move that retrospectively complicates Dickens'''' own defence of fancy.',
  '{"verbs": ["idealises sympathetic imagination", "subjects imagination to ethical scrutiny", "presents sympathy as", "makes imagination both necessary and"], "connectives": ["Dickens idealises imagination; McEwan arraigns it", "both texts place moral imagination at the centre of ethical life but disagree about its reliability", "where Sissy''''s fancy is redemptive, Briony''''s narrative imagination is the source of harm"], "counter_positions": ["Briony''''s imaginative failure may make the novel sceptical of fiction itself \u2014 or it may affirm fiction as the only medium through which acknowledgement remains possible", "Sissy''''s redemptive fancy may be read as sentimentalised \u2014 the novel does not test it as hard as it tests Gradgrind''''s system"]}'::jsonb,
  'The most philosophically rich axis in the dataset. Level 5 students should use this to evaluate what the texts say fiction is FOR.',
  12
)
ON CONFLICT (slug) DO NOTHING;

-- c8_structure_consequence | How structure turns error into consequence
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c8_structure_consequence',
  'How structure turns error into consequence',
  'c8',
  'Structure and Consequence',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens'' three-part structure — Sowing, Reaping, Garnering — turns Gradgrind''s educational theory into social and emotional consequence.',
  'McEwan''s three parts and coda turn Briony''s childhood error into wartime suffering and belated authorial reconstruction.',
  'Dickens uses an openly moral causal structure whereas McEwan uses delayed disclosure and retrospective revision to unsettle causality.',
  'Both novels structure consequence across time, showing how early acts of misperception or ideology produce long-term damage.',
  ARRAY['biblical structure', 'tripartite form', 'foreshadowing', 'moral causality', 'symbolic titles']::text[],
  ARRAY['three-part structure', 'coda', 'anachrony', 'delayed revelation', 'metafiction']::text[],
  ARRAY['Victorian moral realism', 'serialised fiction', 'biblical moral pattern']::text[],
  ARRAY['late twentieth-century historiographic metafiction', 'war memory', 'narrative ethics']::text[],
  'Moral causality as harvest versus retrospective reconstruction as trauma.',
  ARRAY['Dickens'''' structure may appear didactic while McEwan''''s may appear more ethically ambiguous because it withholds final truth.']::text[],
  ARRAY['Compare structure', 'Compare consequences', 'Compare beginnings and endings', 'Compare narrative form']::text[],
  ARRAY['Bk 1 (Sowing)', 'Bk 2 (Reaping)', 'Bk 3 (Garnering)', 'Bk 3 Ch 9 (the futurity — the narrator''''s closing prophecy)']::text[],
  ARRAY['Pt 1 (1935)', 'Pt 2 (1940 — Dunkirk)', 'Pt 3 (1940 — nursing)', 'Pt 4 (1999 — the coda)']::text[],
  'Both novels show that early mistakes lead to later consequences — Dickens through a clear moral harvest, McEwan through belated disclosure that reframes everything the reader thought they knew.',
  'Dickens organises consequence as moral harvest whereas McEwan organises consequence as traumatic belatedness and narrative revision — staging an evaluative disagreement about whether structure can deliver moral clarity or only the illusion of it.',
  '{"verbs": ["organises consequence as moral harvest", "stages consequence as traumatic belatedness", "uses structure to deliver", "withholds the structure''''s own logic until"], "connectives": ["Dickens'''' structure delivers clarity; McEwan''''s withholds it", "both novels use tripartite structure but to opposed evaluative ends", "where Sowing/Reaping/Garnering enacts a providential logic, McEwan''''s coda dismantles it"], "counter_positions": ["Dickens'''' structure may appear didactic \u2014 an objection the Level 5 student should acknowledge and answer", "McEwan''''s retrospective revision may seem evasive, but it is precisely that evasion that constitutes his ethical argument"]}'::jsonb,
  'Essential AO2 axis — the structural comparison is one of the most precise and testable in the dataset.',
  13
)
ON CONFLICT (slug) DO NOTHING;

-- c3_setting_social_critique | Places as moral systems
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c3_setting_social_critique',
  'Places as moral systems',
  'c3',
  'Setting and Social Critique',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens'' Coketown embodies industrial monotony, pollution and the reduction of human life to production.',
  'McEwan''s Tallis estate and later wartime settings encode class privilege, emotional distance and historical rupture.',
  'Dickens uses setting as overt social symbolism whereas McEwan uses setting to expose hidden class codes and later the collapse of privilege under war.',
  'Both novels make place morally expressive: settings reveal the values and failures of the societies that produce them.',
  ARRAY['industrial imagery', 'symbolic setting', 'repetition', 'grotesque description', 'contrast']::text[],
  ARRAY['descriptive detail', 'country-house symbolism', 'juxtaposition', 'war realism', 'sensory imagery']::text[],
  ARRAY['industrial urbanisation', 'factory towns', 'Victorian social problem fiction']::text[],
  ARRAY['English country-house tradition', 'interwar privilege', 'Second World War displacement']::text[],
  'Industrial symbolic setting versus class-coded domestic and wartime setting — diagrammatic versus mnemonic.',
  ARRAY['Coketown may seem exaggerated but its symbolic function makes visible the moral logic of industrial capitalism.']::text[],
  ARRAY['Compare settings', 'Compare social criticism', 'Compare places', 'Compare public and private worlds']::text[],
  ARRAY['Bk 1 Ch 5 (Coketown: The Key-note)', 'Bk 1 Ch 6 (Pegasus''''s Arms — the contrast)', 'Bk 2 Ch 6 (the chemist)']::text[],
  ARRAY['Pt 1 Ch 2 (the fountain)', 'Pt 2 (Dunkirk)', 'Pt 3 (St Thomas''''s)', 'Pt 4 (1999 London)']::text[],
  'Both writers use places to show what society is like — Dickens through industrial caricature, McEwan through the domestic detail of the country house and the sensory horror of Dunkirk.',
  'Dickens turns setting into social indictment while McEwan uses setting to expose the fragility and violence beneath cultivated privilege — making place in both novels an argument rather than a background.',
  '{"verbs": ["turns setting into social indictment", "exposes the class coding of", "makes place morally expressive of", "uses landscape to argue"], "connectives": ["Dickens'''' settings argue spatially through juxtaposition; McEwan''''s argue temporally through the revisiting of the same site", "both make setting an argument rather than a backdrop, but the argument differs", "where Coketown is diagrammatic \u2014 meaning one thing \u2014 the Tallis estate means different things at different times"], "counter_positions": ["Coketown may seem exaggerated to the point of caricature \u2014 an objection worth addressing, since the caricature is itself the argument", "the Tallis estate may be read as nostalgic pastoral or as a critique of the pastoral \u2014 McEwan sustains both"]}'::jsonb,
  'Directly matched to 2024 Q2 (settings). Also productive for any question on social critique or the relationship between place and power.',
  14
)
ON CONFLICT (slug) DO NOTHING;

-- c5_law_justice_injustice | Institutions and failed justice
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c5_law_justice_injustice',
  'Institutions and failed justice',
  'c5',
  'Law Justice and Injustice',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens shows justice failing the poor through Stephen''s vulnerability, Bounderby''s power and the limited protection offered to workers.',
  'McEwan shows justice failing Robbie through class prejudice, sexual panic and Briony''s confident but false testimony.',
  'Dickens critiques social and economic injustice while McEwan focuses on legal and narrative injustice generated by class and misinterpretation.',
  'Both novels expose justice as vulnerable to power, prejudice and false narratives.',
  ARRAY['plot irony', 'social realism', 'narratorial judgement', 'contrast', 'pathos']::text[],
  ARRAY['legal discourse', 'focalisation', 'retrospective irony', 'withheld truth', 'letters']::text[],
  ARRAY['Victorian labour law', 'poverty', 'industrial relations', 'class inequality']::text[],
  ARRAY['1930s criminal justice', 'sexual morality', 'class bias', 'wartime disruption']::text[],
  'Social-economic injustice versus legal-narrative injustice.',
  ARRAY['Robbie''''s conviction can be read not only as Briony''''s fault but as a consequence of a whole class and legal system ready to believe him guilty.']::text[],
  ARRAY['Compare justice', 'Compare injustice', 'Compare law', 'Compare false accusation']::text[],
  ARRAY['Bk 1 Ch 11 (Stephen at Bounderby''''s — class and power)', 'Bk 2 Ch 12 (Louisa and the law of marriage)', 'Bk 3 Ch 6 (Stephen''''s death — the system''''s verdict)']::text[],
  ARRAY['Pt 1 Ch 13 (the accusation)', 'Pt 2 (Robbie''''s letter as legal evidence)', 'Pt 4 (the retrospective disclosure of the true perpetrator)']::text[],
  'Both writers show unfair treatment and injustice — Dickens through economic exclusion, McEwan through false testimony given class authority.',
  'Dickens and McEwan both present justice as compromised by social hierarchy, but McEwan makes narrative itself part of the injustice — so that the legal system and the storytelling system are shown to be the same system.',
  '{"verbs": ["exposes justice as class-determined", "makes narrative complicit in legal injustice", "presents the law as a function of", "shows credibility as"], "connectives": ["Dickens'''' injustice is economic; McEwan''''s is narrative and legal", "both texts show justice failing those without social power, but differ in the mechanism of that failure", "where Stephen''''s suffering is economic, Robbie''''s is the consequence of a story given legal force"], "counter_positions": ["Robbie''''s conviction is not only Briony''''s fault but the product of a class and legal system already primed to find him guilty", "Dickens'''' representation of legal injustice may be politically committed or melodramatic \u2014 a distinction worth evaluating"]}'::jsonb,
  'Pairs strongly with Power and Voice (cm_010) and Class (cm_002). The argument that ''''the legal system and the narrative system are the same system'''' is a reliable Level 5 close.',
  15
)
ON CONFLICT (slug) DO NOTHING;

-- c8_memory_retrospection | Looking back as judgement
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c8_memory_retrospection',
  'Looking back as judgement',
  'c8',
  'Memory and Retrospection',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens'' narrative looks back over moral causes and consequences to expose the failure of utilitarian values.',
  'McEwan makes retrospection central as Briony revisits and rewrites the past in pursuit of atonement.',
  'Dickens uses retrospection to clarify moral judgement while McEwan uses retrospection to expose the instability and insufficiency of memory.',
  'Both texts show the past as something that continues to exert pressure on the present but they differ in the reliability of retrospective understanding.',
  ARRAY['moral structure', 'foreshadowing', 'narrative closure', 'retrospective judgement']::text[],
  ARRAY['retrospective narration', 'metafiction', 'memory gaps', 'coda', 'temporal layering']::text[],
  ARRAY['Victorian moral fiction', 'linear progress and reform']::text[],
  ARRAY['late twentieth-century memory culture', 'trauma', 'historical fiction']::text[],
  'Clarifying retrospection versus unstable retrospection.',
  ARRAY['Briony''''s memory may be an act of confession or an act of narrative possession.']::text[],
  ARRAY['Compare memory', 'Compare the past', 'Compare endings', 'Compare retrospective narration']::text[],
  ARRAY['Bk 1-3 (the tripartite retrospective structure)', 'Bk 3 Ch 9 (the futurity — Dickens looks forward and back)']::text[],
  ARRAY['Pt 4 (1999 — Briony''''s retrospective frame)', 'the fountain revisited (Pt 1 Ch 1 and Ch 2)']::text[],
  'Both texts look back at past events to judge them — Dickens to secure moral meaning, McEwan to expose the instability of memory and the insufficiency of retrospective repair.',
  'Dickens uses retrospective structure to secure moral meaning whereas McEwan uses it to question whether the past can ever be ethically recovered — making retrospection itself the site of the two novels'''' evaluative disagreement.',
  '{"verbs": ["uses retrospection to secure meaning", "uses retrospection to destabilise meaning", "positions the past as", "treats memory as"], "connectives": ["Dickens'''' retrospection clarifies; McEwan''''s retrospection questions", "both texts look back as a form of moral judgement, but they disagree about what looking back can achieve", "where Dickens'''' narrator retrospectively settles accounts, Briony''''s retrospection reopens them"], "counter_positions": ["Briony''''s retrospective account may be honest confession or the final act of narrative control \u2014 the epilogue refuses to adjudicate", "Dickens'''' moral retrospect may be read as providential confidence or as ideological certainty the plot itself complicates"]}'::jsonb,
  'Pairs naturally with Structure and Consequence (cm_013). Together they form the complete AO2 temporal comparison.',
  16
)
ON CONFLICT (slug) DO NOTHING;

-- c5_religion_morality_secular | Moral frameworks after failure
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c5_religion_morality_secular',
  'Moral frameworks after failure',
  'c5',
  'Religion Morality and Secular Ethics',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens draws on Christian moral patterns of sin, recognition and possible reform even in a largely social-problem novel.',
  'McEwan uses the language of atonement but places it in a secular literary framework where forgiveness may be impossible.',
  'Dickens allows moral correction within a recognisable ethical order whereas McEwan presents atonement as an unresolved secular and aesthetic problem.',
  'Both novels ask what moral repair is possible after harm, yet differ in whether the narrative world offers redemption.',
  ARRAY['biblical allusion', 'moral commentary', 'symbolic structure', 'sentimental realism']::text[],
  ARRAY['metafiction', 'title symbolism', 'confession', 'irony', 'coda']::text[],
  ARRAY['Christian morality', 'Victorian reform culture', 'biblical literacy']::text[],
  ARRAY['secular postwar culture', 'literary ethics', 'trauma and memory']::text[],
  'Reformist moral order versus secular unresolved atonement.',
  ARRAY['The title Atonement may promise moral repair but the ending may deny that such repair can genuinely occur.']::text[],
  ARRAY['Compare morality', 'Compare redemption', 'Compare forgiveness', 'Compare atonement']::text[],
  ARRAY['Bk 1-3 structure (Sowing/Reaping/Garnering — the biblical pattern)', 'Bk 3 Ch 1 (Gradgrind''''s recognition — the conversion narrative)']::text[],
  ARRAY['the title', 'Pt 4 (the secular confession)', 'the epilogue''''s final irony']::text[],
  'Dickens gives clearer moral lessons while McEwan makes atonement more uncertain — the very word of the title is subjected to a question the novel refuses to answer.',
  'Dickens retains a reformist moral framework whereas McEwan tests whether secular fiction can perform the work once associated with confession and redemption — and implicitly answers: not quite.',
  '{"verbs": ["retains a reformist moral framework", "tests the secular limits of atonement", "uses [biblical/literary] structure to argue", "places moral repair within"], "connectives": ["Dickens'''' moral world allows reform; McEwan''''s does not", "both texts ask whether harm can be repaired, but they disagree about the conditions under which repair is possible", "where Dickens'''' biblical structure enacts a providential logic, McEwan''''s title poses the question his novel refuses to answer"], "counter_positions": ["The title Atonement may promise what the novel cannot deliver \u2014 or it may be an ironic framing that defines the gap as the novel''''s subject", "Dickens'''' Christian moral framework may be read as sincere or as a secular humanism wearing religious clothes"]}'::jsonb,
  'Productive for questions on endings, moral resolution, or the role of fiction in ethical life. Best paired with Guilt (cm_005) and Endings (cm_020).',
  17
)
ON CONFLICT (slug) DO NOTHING;

-- c6_work_duty_human_cost | Labour as moral and physical burden
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c6_work_duty_human_cost',
  'Labour as moral and physical burden',
  'c6',
  'Work Duty and Human Cost',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens presents labour through the exploited ''Hands'' of Coketown and Stephen''s dignified but constrained working life.',
  'McEwan presents work through nursing, soldiering and writing — each linked to duty, suffering and attempted repair.',
  'Dickens focuses on industrial labour as exploitation while McEwan presents wartime and literary labour as service, trauma and belated restitution.',
  'Both novels show work as morally significant but also as a site where bodies and identities are damaged.',
  ARRAY['industrial imagery', 'collective noun Hands', 'pathos', 'contrast', 'social realism']::text[],
  ARRAY['sensory realism', 'medical detail', 'war narration', 'metafiction', 'symbolism']::text[],
  ARRAY['Victorian factory labour', 'industrial relations', 'working-class conditions']::text[],
  ARRAY['wartime nursing', 'military service', 'women''''s war work', 'authorship as labour']::text[],
  'Industrial exploitation versus wartime and narrative duty.',
  ARRAY['Briony''''s nursing can be read as genuine penance or as insufficient symbolic substitution for the harm she caused.']::text[],
  ARRAY['Compare work', 'Compare duty', 'Compare suffering', 'Compare social responsibility']::text[],
  ARRAY['Bk 1 Ch 5 (the Hands of Coketown)', 'Bk 1 Ch 11 (Stephen''''s working life)', 'Bk 3 Ch 6 (Stephen''''s death — the system''''s final claim)']::text[],
  ARRAY['Pt 3 (Briony''''s nursing — the body''''s labour)', 'Pt 2 (Robbie''''s soldiering)', 'Pt 4 (writing as Briony''''s self-imposed work)']::text[],
  'Both texts show that work can be difficult and damaging — Dickens through industrial exploitation, McEwan through the bodily cost of nursing and the moral cost of writing.',
  'Dickens presents work as exploitation under capitalism while McEwan reframes labour as wartime duty, bodily suffering and artistic penance — making work in both novels the place where the social system exacts its cost.',
  '{"verbs": ["presents labour as exploitation", "reframes work as duty and penance", "shows the body''''s cost of", "treats labour as"], "connectives": ["Dickens'''' work is imposed by economic necessity; McEwan''''s is chosen as self-imposed discipline", "both texts use work to show what systems extract from individuals, though the systems differ", "where the factory extracts labour, the hospital and the writing desk exact a different kind of cost"], "counter_positions": ["Briony''''s nursing may be genuine penance or symbolic substitution \u2014 the novel is deliberately ambiguous", "Stephen''''s dignity in labour may be read as moral heroism or as the idealisation of working-class suffering"]}'::jsonb,
  'Pairs with Industrialism and War (cm_009) to form the full treatment of systemic suffering. Also connects to Guilt (cm_005) through the idea of penance as labour.',
  18
)
ON CONFLICT (slug) DO NOTHING;

-- c4_desire_sexuality_misreading | Sexual knowledge and social panic
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c4_desire_sexuality_misreading',
  'Sexual knowledge and social panic',
  'c4',
  'Desire Sexuality and Misreading',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens treats desire indirectly through Louisa''s emotionally starved marriage and Harthouse''s manipulative courtship.',
  'McEwan makes sexual misreading central as Briony misunderstands adult desire between Cecilia and Robbie and converts it into accusation.',
  'Dickens presents desire as constrained by marriage, class and emotional repression while McEwan presents sexual knowledge as misinterpreted through childhood, class and literary scripts.',
  'Both novels show sexuality as socially regulated and easily distorted by power, ignorance and narrative assumptions.',
  ARRAY['indirection', 'dialogue', 'character contrast', 'symbolic repression', 'melodrama']::text[],
  ARRAY['focalisation', 'letters', 'erotic imagery', 'misreading', 'narrative delay']::text[],
  ARRAY['Victorian marriage laws', 'female respectability', 'patriarchal codes']::text[],
  ARRAY['1930s sexual morality', 'class scandal', 'childhood innocence', 'patriarchal law']::text[],
  'Marital repression versus catastrophic sexual misinterpretation.',
  ARRAY['Harthouse''''s role may be read as villainous seduction or as exposing the emotional emptiness Gradgrind created.']::text[],
  ARRAY['Compare desire', 'Compare relationships', 'Compare marriage', 'Compare sexual misunderstanding']::text[],
  ARRAY['Bk 1 Ch 14-15 (Louisa''''s marriage)', 'Bk 2 Ch 7 (Harthouse and Louisa)', 'Bk 2 Ch 12 (the confrontation)']::text[],
  ARRAY['Pt 1 Ch 2 (the fountain scene)', 'Pt 1 Ch 8 (Robbie''''s letter)', 'Pt 1 Ch 10 (the library)']::text[],
  'Both texts show confusion or problems around relationships and desire — Dickens through what marriage suppresses, McEwan through what a child catastrophically misreads.',
  'Dickens encodes desire through social repression while McEwan foregrounds desire as the site where class, childhood and narrative error collide — making the fountain scene the novel''''s moral catastrophe in miniature.',
  '{"verbs": ["encodes desire through social repression", "foregrounds desire as the collision site of class and misreading", "presents sexuality as regulated by", "makes misreading a function of"], "connectives": ["Dickens encodes desire; McEwan makes it the site of catastrophe", "both texts show sexuality as social rather than private, but the mechanism of distortion differs", "where Dickens suppresses desire through marriage, McEwan exposes it through a child''''s misreading"], "counter_positions": ["Harthouse may be a villain or a symptom of the emotional vacancy Gradgrind has produced \u2014 the novel does not adjudicate", "the fountain scene may be read as erotic or merely as two adults in conflict \u2014 the ambiguity is Briony''''s, and the novel''''s"]}'::jsonb,
  'Directly relevant to marriage questions (2022 Q1) and any question about relationships between characters. Pairs with Women and Agency (cm_007).',
  19
)
ON CONFLICT (slug) DO NOTHING;

-- c5_endings_resolution | Closure and its discontents
INSERT INTO thematic_axis_pairings (
  slug, axis_title, cluster_id, theme_family,
  exam_board, qualification, component, paper_code, text_1, text_2,
  text_1_concept, text_2_concept, comparative_divergence,
  ao1_conceptual_argument,
  ao2_text_1_methods, ao2_text_2_methods,
  ao3_text_1_context, ao3_text_2_context,
  ao4_comparison_type,
  critical_perspectives, likely_exam_stems,
  text_1_locations, text_2_locations,
  level_4_version, level_5_version,
  sentence_components, teacher_note, sort_order
) VALUES (
  'c5_endings_resolution',
  'Closure and its discontents',
  'c5',
  'Endings and Resolution',
  'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  'Hard Times', 'Atonement',
  'Dickens offers partial moral resolution: some false values are exposed though social problems remain only partly repaired.',
  'McEwan denies conventional consolation by revealing that Robbie and Cecilia''s reunion is fictional and that atonement remains unresolved.',
  'Dickens moves toward moral correction and limited closure while McEwan dismantles closure by exposing it as authored consolation.',
  'Both endings ask whether narrative can repair suffering — Dickens is more reformist whereas McEwan is more sceptical.',
  ARRAY['closure', 'moral resolution', 'narratorial prophecy', 'sentimental ending']::text[],
  ARRAY['twist ending', 'coda', 'metafiction', 'retrospective revelation', 'irony']::text[],
  ARRAY['Victorian serial fiction', 'moral closure', 'reformist realism']::text[],
  ARRAY['postmodern anti-closure', 'trauma history', 'late twentieth-century scepticism']::text[],
  'Moral closure as judgement versus exposed fictional consolation.',
  ARRAY['Dickens'''' ending may be criticised as sentimental while McEwan''''s may be criticised as withholding ethical satisfaction.']::text[],
  ARRAY['Compare endings', 'Compare resolution', 'Compare consequences', 'Compare narrative closure']::text[],
  ARRAY['Bk 3 Ch 8 (Sleary''''s farewell)', 'Bk 3 Ch 9 (the narrator''''s futurity — Sissy''''s children)']::text[],
  ARRAY['Pt 4 (Briony''''s disclosure)', 'the last pages of the epilogue']::text[],
  'Both endings show consequences but McEwan''''s ending is more shocking and unresolved — it exposes the happy ending as a fiction the author has chosen to give and then withheld.',
  'Dickens offers narrative closure as moral judgement whereas McEwan exposes closure as a fiction that cannot restore the dead — staging the most direct evaluative confrontation in the dataset about what endings are for.',
  '{"verbs": ["offers closure as moral judgement", "exposes closure as fictional consolation", "uses the ending to argue", "withholds the consolation that"], "connectives": ["Dickens'''' ending delivers judgement; McEwan''''s ending exposes the desire for judgement", "both endings ask what fiction can repair \u2014 and disagree", "where Dickens'''' narrator prophecies a better future, McEwan''''s Briony reveals that the future she narrated was invented"], "counter_positions": ["Dickens'''' ending may be sentimental \u2014 a charge worth addressing, since the question is whether sentimentality is the right word for a moral position the text has consistently argued for", "McEwan''''s ending may be accused of withholding satisfaction unfairly, or praised for refusing the consolation that would let the reader off the hook"]}'::jsonb,
  'The best closing axis for almost any essay — the evaluative comparison of the endings is the highest-altitude move available in this pairing.',
  20
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 3. PAST PAPER QUESTIONS (11 rows: 4 real + 7 synthetic)
-- Unchanged from v1 — question stems do not change with schema reconciliation.
-- ============================================================================

INSERT INTO past_paper_questions (
  question_id, exam_board, qualification, component, paper_code,
  exam_year, exam_session, question_number, theme,
  question_stem, micro_axis_topic,
  total_marks, ao_emphasis, difficulty_band,
  suggested_paragraph_angles, is_real_paper, notes
) VALUES

('edx_2024_q1', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  2024, 'Summer', 1, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present relationships between female characters. You must relate your discussion to relevant contextual factors.',
  'female relationships', 40, 'Balanced AO1-AO4; AO4 strong', 'L4-L5 bridge',
  ARRAY[
    'Women as moral antitheses (Sissy/Louisa) versus women as competing narrative agents (Briony/Cecilia)',
    'Cross-class female recognition (HT) versus failure of female solidarity (AT)',
    'Mrs Sparsit''s predatory surveillance as structural parallel to Briony''s destructive observation',
    'The closing female position: Sissy at Stone Lodge versus the surviving Lola'
  ]::text[], true, 'released paper'),

('edx_2024_q2', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  2024, 'Summer', 2, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts make use of settings. You must relate your discussion to relevant contextual factors.',
  'settings', 40, 'AO2/AO3-led', 'L4 core',
  ARRAY[
    'Diagrammatic (Coketown) versus mnemonic (Tallis estate) settings',
    'The circus as counter-space versus the library as ambiguous space',
    'Dunkirk as the wartime extension of Coketown''s dehumanising logic',
    'The metanarrative of Pt 4 casting retrospective doubt on all earlier settings'
  ]::text[], true, 'released paper'),

('edx_2022_q1', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  2022, 'Summer', 1, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present marriage. You must relate your discussion to relevant contextual factors.',
  'marriage', 40, 'Balanced AO1-AO4', 'L4-L5 bridge',
  ARRAY[
    'Marriage as economic-doctrinal contract (Louisa-Bounderby) versus social burial of truth (Lola-Paul)',
    'The legal trap of Stephen''s marriage versus the narrative trap of the unwritten Cecilia-Robbie marriage',
    'Desire constrained (Louisa) versus desire catastrophically misread (Briony)',
    'Closural form: Dickens'' marriages collapse the system; McEwan''s marriages preserve it'
  ]::text[], true, 'released paper'),

('edx_2022_q2', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  2022, 'Summer', 2, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present characters who attempt to achieve independence. You must relate your discussion to relevant contextual factors.',
  'independence', 40, 'AO1-led with AO4 strong', 'L4-L5 bridge',
  ARRAY[
    'Doctrinal versus narrative constraints on bids for independence',
    'Sissy''s exemption, Louisa''s failed flight, Stephen''s resistance — three classed bids',
    'Cecilia''s assertion, Robbie''s stripped autonomy, Briony''s penance — three authored bids',
    'Independence as relational rather than absolute — the L5 evaluative move'
  ]::text[], true, 'released paper'),

('syn_childhood_innocence', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 1, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present the loss of innocence.',
  'innocence / loss', 40, 'AO1/AO2-led', 'L4-L5 bridge',
  ARRAY[
    'Innocence as casualty (Dickens) versus innocence as hazard (McEwan)',
    'Systemic damage versus individual misreading as the mechanism of loss',
    'The Romantic inheritance interrogated by both novels'
  ]::text[], false, 'synthetic; high-frequency thematic territory'),

('syn_education', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 2, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present education and its consequences.',
  'education', 40, 'AO2-led; strong AO3', 'L4 core',
  ARRAY[
    'The curriculum (Dickens) versus the canon (McEwan) as miseducative',
    'Bitzer and Briony as parallel products of opposed pedagogies',
    'Recognition scenes: Gradgrind''s versus the elderly Briony''s'
  ]::text[], false, 'synthetic; education recurs in indicative content across years'),

('syn_narrative_voice', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 3, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present the role of the storyteller.',
  'narrative voice / storyteller', 40, 'AO2-led; AO4 strong', 'L5 stretch',
  ARRAY[
    'Narrator as moral arbiter (Dickens) versus narrator as ethical problem (McEwan)',
    'The reader''s position: instructed (Dickens) versus implicated (McEwan)',
    'The novel-as-moral-institution — the L5 evaluative ground'
  ]::text[], false, 'synthetic; AO2 powerhouse axis'),

('syn_perception_truth', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 4, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present truth and misunderstanding.',
  'perception / truth', 40, 'AO1-led with AO2/AO3 strong', 'L5 stretch',
  ARRAY[
    'Institutional misperception (Dickens) versus aesthetic misperception (McEwan)',
    '"Now, what I want is, Facts" and "I saw him with my own eyes" as the same epistemological claim',
    'Class as the prior condition of whose perception is credited'
  ]::text[], false, 'synthetic; high-yield L5 territory'),

('syn_class', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 5, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present social class.',
  'class', 40, 'Balanced AO1-AO4', 'L4-L5 bridge',
  ARRAY[
    'Class as visible architecture (Coketown) versus invisibly ratified habit (Tallis)',
    'Bounderby''s exposure versus the Marshalls'' survival as opposed political verdicts',
    'Class as the prior condition of credibility — the L5 evaluative move'
  ]::text[], false, 'synthetic; recurring exam territory'),

('syn_time_memory', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 6, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts make use of time and memory.',
  'time / memory', 40, 'AO2-led; AO4 strong', 'L5 stretch',
  ARRAY[
    'Linear-biblical (Sowing/Reaping/Garnering) versus recursive-revisable (1935/1940/1999)',
    'Temporal form as moral argument: time delivers or revokes judgement',
    'The metafictional disclosure as a temporal manoeuvre'
  ]::text[], false, 'synthetic; AO2 sophistication territory'),

('syn_guilt_confession', 'Pearson Edexcel', 'A-Level English Literature', 'Component 2: Prose', '9ET0/02',
  9999, 'Synthetic', 7, 'Childhood',
  'Compare the ways in which the writers of your two chosen texts present guilt and the desire to confess.',
  'guilt / confession', 40, 'Balanced AO1-AO4', 'L5 stretch',
  ARRAY[
    'Plot-delivered moral consequence (Dickens) versus metafictional refusal (McEwan)',
    'The reformist framework versus secular atonement as an unresolved problem',
    'Can fiction deliver what confession requires? — the L5 evaluative close'
  ]::text[], false, 'synthetic; headline C5 territory')

ON CONFLICT (question_id) DO NOTHING;


-- ============================================================================
-- 4. AXIS QUESTION LINKS (updated slugs for v2 axes)
-- ============================================================================

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c4_women_agency' AND q.question_id = 'edx_2024_q1'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c4_desire_sexuality_misreading', 'c1_family_emotional_formation') AND q.question_id = 'edx_2024_q1'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c3_setting_social_critique' AND q.question_id = 'edx_2024_q2'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c3_class_social_hierarchy', 'c8_structure_consequence') AND q.question_id = 'edx_2024_q2'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c4_desire_sexuality_misreading' AND q.question_id = 'edx_2022_q1'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c4_women_agency', 'c3_class_social_hierarchy') AND q.question_id = 'edx_2022_q1'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c4_women_agency' AND q.question_id = 'edx_2022_q2'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c2_power_voice', 'c3_class_social_hierarchy') AND q.question_id = 'edx_2022_q2'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c1_innocence_misinterpretation' AND q.question_id = 'syn_childhood_innocence'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c1_education_formation', 'c7_moral_imagination') AND q.question_id = 'syn_childhood_innocence'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c1_education_formation' AND q.question_id = 'syn_education'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c1_innocence_misinterpretation', 'c7_imagination_rationality') AND q.question_id = 'syn_education'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c2_truth_narrative_authority' AND q.question_id = 'syn_narrative_voice'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c7_moral_imagination', 'c5_guilt_responsibility') AND q.question_id = 'syn_narrative_voice'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c2_truth_narrative_authority' AND q.question_id = 'syn_perception_truth'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c1_innocence_misinterpretation', 'c2_power_voice') AND q.question_id = 'syn_perception_truth'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c3_class_social_hierarchy' AND q.question_id = 'syn_class'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c3_setting_social_critique', 'c3_social_performance_identity') AND q.question_id = 'syn_class'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c8_memory_retrospection' AND q.question_id = 'syn_time_memory'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c8_structure_consequence', 'c5_endings_resolution') AND q.question_id = 'syn_time_memory'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'primary'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug = 'c5_guilt_responsibility' AND q.question_id = 'syn_guilt_confession'
ON CONFLICT DO NOTHING;

INSERT INTO axis_question_links (axis_id, question_id, link_role)
SELECT a.id, q.id, 'supporting'
FROM thematic_axis_pairings a, past_paper_questions q
WHERE a.slug IN ('c5_endings_resolution', 'c2_truth_narrative_authority') AND q.question_id = 'syn_guilt_confession'
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- End seed v2.
-- Verify with:
--   SELECT count(*) FROM thematic_axis_pairings;  -- expect 20
--   SELECT cluster_id, count(*) FROM thematic_axis_pairings GROUP BY 1 ORDER BY 1;
--   SELECT count(*) FROM past_paper_questions;     -- expect 11
--   SELECT count(*) FROM axis_question_links;      -- expect ~33
-- ============================================================================