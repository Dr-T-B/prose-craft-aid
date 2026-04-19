-- Prose Craft Aid
-- Minimal seed data for verifying a freshly created backend.
--
-- Apply this after sql/core_current_schema.sql in a new Supabase project.
-- The goal is not completeness. The goal is to give Builder + Library enough
-- data to render and let you verify the core app flow.

begin;

-- ---------------------------------------------------------------------------
-- Routes
-- ---------------------------------------------------------------------------

insert into public.routes (
  id, name, level_tag, core_question, hard_times_emphasis, atonement_emphasis, comparative_insight, best_use
) values
  (
    'r_guilt_repair',
    'Guilt and repair',
    'strong',
    'How do both novels explore guilt and the possibility of repair?',
    'Dickens frames guilt through social failure, moral education, and the consequences of neglect.',
    'McEwan frames guilt through misinterpretation, memory, and belated self-consciousness.',
    'Both texts link guilt to narrative structure, but Dickens permits clearer moral repair than McEwan.',
    'Use for guilt, responsibility, consequence, and moral judgement questions.'
  ),
  (
    'r_class_mechanism',
    'Class and social mechanism',
    'strong',
    'How do both novels expose class as a structuring force?',
    'Dickens makes class visible through industrial hierarchy, utilitarian schooling, and economic discipline.',
    'McEwan shows class operating through perception, prejudice, and narrative power.',
    'Both texts show class shaping judgement, but McEwan foregrounds misreading while Dickens foregrounds system.',
    'Use for class, power, social structure, and control questions.'
  ),
  (
    'r_imagination_reason',
    'Imagination versus rationality',
    'perceptive',
    'How do both novels test the value and danger of imagination?',
    'Dickens attacks reductive fact-worship while also warning against emotional deformation.',
    'McEwan shows imagination as both creative power and destructive falsification.',
    'Both texts distrust simplification: Dickens critiques fact without imagination; McEwan critiques imagination without ethical restraint.',
    'Use for imagination, interpretation, reason, fiction, and truth questions.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

insert into public.questions (
  id, family, level_tag, stem, likely_core_methods, primary_route_id, secondary_route_id
) values
  (
    'q_guilt_001',
    'guilt',
    'strong',
    'Compare the ways in which guilt is presented in Hard Times and Atonement.',
    array['narrative perspective', 'symbolism', 'moral contrast'],
    'r_guilt_repair',
    'r_imagination_reason'
  ),
  (
    'q_class_001',
    'class',
    'strong',
    'Compare the ways in which class shapes the worlds of Hard Times and Atonement.',
    array['contrast', 'setting', 'narrative voice'],
    'r_class_mechanism',
    'r_guilt_repair'
  ),
  (
    'q_imagination_001',
    'imagination',
    'perceptive',
    'Compare the presentation of imagination in Hard Times and Atonement.',
    array['metafiction', 'irony', 'structural framing'],
    'r_imagination_reason',
    'r_guilt_repair'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Quote methods
-- ---------------------------------------------------------------------------

insert into public.quote_methods (
  id, source_text, quote_text, method, effect_prompt, meaning_prompt, level_tag, best_themes
) values
  (
    'qm_ht_fact_001',
    'Hard Times',
    'Now, what I want is, Facts.',
    'Imperative opening and didactic declarative compression',
    'Establishes Gradgrind''s authority and the ideological violence of reductive education.',
    'Dickens presents fact-worship as an impoverished moral system that suppresses imagination and feeling.',
    'core',
    array['imagination', 'class']
  ),
  (
    'qm_ht_sissy_001',
    'Hard Times',
    'Girl number twenty.',
    'Dehumanising numeric designation',
    'Shows how utilitarian schooling strips individuality from pupils.',
    'Classroom logic becomes a social logic: people are treated as units rather than persons.',
    'core',
    array['class', 'imagination']
  ),
  (
    'qm_ht_tom_001',
    'Hard Times',
    'I do not know what this jolly old Jaundiced Jail is made for.',
    'Ironic tonal dissonance and social satire',
    'Reveals Tom''s moral immaturity and refusal of responsibility.',
    'Dickens links guilt to self-excusing rhetoric and failed moral formation.',
    'high',
    array['guilt', 'class']
  ),
  (
    'qm_at_briony_001',
    'Atonement',
    'The truth had become as ghostly as invention.',
    'Abstract metaphor and epistemological instability',
    'Blurs the boundary between fact and fiction.',
    'McEwan presents guilt as inseparable from narrative unreliability and belated self-awareness.',
    'core',
    array['guilt', 'imagination']
  ),
  (
    'qm_at_letter_001',
    'Atonement',
    'How could that constitute an indictment?',
    'Rhetorical question and defensive focalisation',
    'Shows the instability of judgement and the self-protective logic of interpretation.',
    'McEwan critiques how perception is shaped by innocence, class assumptions, and narrative framing.',
    'high',
    array['guilt', 'class', 'imagination']
  ),
  (
    'qm_at_ending_001',
    'Atonement',
    'There was our crime. Lola did not return.',
    'Compressed retrospective confession',
    'Produces a late ethical shock through plain declarative admission.',
    'The ending reframes the novel as an act of atonement that cannot fully repair the damage it narrates.',
    'core',
    array['guilt']
  ),
  (
    'qm_cmp_repair_001',
    'Comparative',
    'Repair in Dickens is social and moral; in McEwan it is narrative and provisional.',
    'Comparative conceptual framing',
    'Gives students a direct cross-text lens for structured comparison.',
    'Helps distinguish the different ethical logics of resolution in the two novels.',
    'high',
    array['guilt', 'imagination']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Comparative matrix
-- ---------------------------------------------------------------------------

insert into public.comparative_matrix (
  id, axis, hard_times, atonement, divergence, themes
) values
  (
    'cm_guilt_001',
    'Guilt and moral consequence',
    'Guilt emerges through social failure, neglected duty, and moral education.',
    'Guilt emerges through misreading, narrative authority, and belated confession.',
    'Dickens permits moral correction more openly; McEwan foregrounds the limits of repair.',
    array['guilt']
  ),
  (
    'cm_class_001',
    'Class and social structure',
    'Class is built into institutions, labour, and the industrial social order.',
    'Class shapes intimacy, interpretation, and access to narrative legitimacy.',
    'Dickens externalises class through system; McEwan internalises it through consciousness and judgement.',
    array['class']
  ),
  (
    'cm_imagination_001',
    'Imagination and truth',
    'Imagination is necessary against the sterility of fact-only ideology.',
    'Imagination is powerful but dangerous when detached from ethical restraint.',
    'Dickens restores imaginative value; McEwan keeps imagination morally compromised.',
    array['imagination']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Theme maps
-- ---------------------------------------------------------------------------

insert into public.theme_maps (
  id, family, one_line
) values
  ('tm_guilt', 'guilt', 'Guilt becomes a test of moral responsibility, judgement, and the limits of repair.'),
  ('tm_class', 'class', 'Class shapes perception, power, and the social possibilities available to characters.'),
  ('tm_imagination', 'imagination', 'Imagination can liberate, distort, or wound depending on its ethical discipline.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- AO5 tensions
-- ---------------------------------------------------------------------------

insert into public.ao5_tensions (
  id, focus, dominant_reading, alternative_reading, safe_stem, level_tag, best_use
) values
  (
    'ao5_guilt_001',
    'guilt',
    'McEwan presents guilt as a lifelong burden that cannot be fully redeemed.',
    'The novel also suggests that narrative is the only imperfect form of repair still available.',
    'Critics differ over whether the ending offers failed redemption or the only possible ethical atonement.',
    'strong',
    array['guilt']
  ),
  (
    'ao5_class_001',
    'class',
    'Dickens exposes class as an oppressive social mechanism.',
    'But he also frames individual moral failings as complicit in that structure.',
    'Some readings emphasise system; others stress the moral failures reproduced within it.',
    'strong',
    array['class']
  ),
  (
    'ao5_imagination_001',
    'imagination',
    'Imagination is presented as necessary to resist reductive worldviews.',
    'Yet imagination also becomes ethically dangerous when it authorises false narratives.',
    'One reading values imaginative freedom; another warns against imagination detached from responsibility.',
    'perceptive',
    array['imagination']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Character cards
-- ---------------------------------------------------------------------------

insert into public.character_cards (
  id, source_text, name, one_line, themes, core_function, structural_role, complication, comparative_link, common_misreading
) values
  (
    'cc_gradgrind',
    'Hard Times',
    'Thomas Gradgrind',
    'Embodies the moral and educational violence of utilitarian fact-worship.',
    array['class', 'imagination'],
    'Represents systematised reduction of human value.',
    'Ideological anchor and source of structural critique.',
    'Later remorse complicates his early certainty.',
    'Comparable to authority figures whose certainty structures other people''s misreadings.',
    'Mistaken as a simple villain rather than a critique of a whole ideology.'
  ),
  (
    'cc_briony',
    'Atonement',
    'Briony Tallis',
    'Her imaginative authority drives the novel''s central moral and narrative crisis.',
    array['guilt', 'imagination', 'class'],
    'Connects interpretation, authorship, and ethical failure.',
    'Focalising consciousness and eventual retrospective narrator.',
    'Both culpable and self-analytical.',
    'Comparable to figures who convert partial knowledge into harmful certainty.',
    'Mistaken as merely childish rather than structurally central to the novel''s ethics.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Symbol entries
-- ---------------------------------------------------------------------------

insert into public.symbol_entries (
  id, source_text, name, one_line, themes
) values
  (
    'se_fact',
    'Hard Times',
    'Facts',
    'Functions as both educational principle and symbol of emotional and moral impoverishment.',
    array['imagination', 'class']
  ),
  (
    'se_fountain',
    'Atonement',
    'The fountain scene',
    'Becomes a symbol of misreading, class anxiety, and interpretive crisis.',
    array['guilt', 'class', 'imagination']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Paragraph jobs
-- ---------------------------------------------------------------------------

insert into public.paragraph_jobs (
  id, route_id, question_family, job_title, text1_prompt, text2_prompt, divergence_prompt, judgement_prompt
) values
  (
    'pj_guilt_1',
    'r_guilt_repair',
    'guilt',
    'Origins of guilt',
    'Show how Dickens roots guilt in failures of duty, education, and social care.',
    'Show how McEwan roots guilt in misinterpretation, false certainty, and narrative intrusion.',
    'Compare whether guilt begins in action, perception, or structure.',
    'Judge which novel allows guilt to become morally productive.'
  ),
  (
    'pj_guilt_2',
    'r_guilt_repair',
    'guilt',
    'Forms of repair',
    'Track where Dickens permits correction, remorse, or social recognition.',
    'Track where McEwan substitutes narration for true restitution.',
    'Compare moral repair with narrative repair.',
    'Judge whether either text genuinely resolves guilt.'
  ),
  (
    'pj_class_1',
    'r_class_mechanism',
    'class',
    'Class as system',
    'Show how Dickens externalises class through industrial and educational systems.',
    'Show how McEwan internalises class through perception, privilege, and access.',
    'Compare visible structures with invisible assumptions.',
    'Judge which novel offers the sharper critique of class power.'
  ),
  (
    'pj_imagination_1',
    'r_imagination_reason',
    'imagination',
    'The ethical uses of imagination',
    'Show how Dickens values imaginative life against reductionism.',
    'Show how McEwan tests imagination as both creation and distortion.',
    'Compare liberating imagination with dangerous imagination.',
    'Judge whether imagination is presented as a moral resource or a threat.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Theses
-- ---------------------------------------------------------------------------

insert into public.theses (
  id, route_id, theme_family, level, thesis_text, paragraph_job_1_label, paragraph_job_2_label, paragraph_job_3_label
) values
  (
    'th_guilt_strong',
    'r_guilt_repair',
    'guilt',
    'strong',
    'Both Hard Times and Atonement present guilt as morally formative, but Dickens frames it as something that can move toward ethical repair, whereas McEwan presents it as permanently shadowed by the limits of narrative restitution.',
    'Origins of guilt',
    'Forms of repair',
    null
  ),
  (
    'th_class_strong',
    'r_class_mechanism',
    'class',
    'strong',
    'Both novels expose class as a structuring force, but Dickens foregrounds visible systems of industrial and educational control while McEwan shows class operating through subtle assumptions, perception, and interpretive authority.',
    'Class as system',
    'Perception and judgement',
    null
  ),
  (
    'th_imagination_perceptive',
    'r_imagination_reason',
    'imagination',
    'perceptive',
    'Both novels distrust simplification, yet they position imagination differently: Dickens restores it as a humane corrective to fact-worship, while McEwan shows imagination as ethically unstable when it claims authority over other lives.',
    'The ethical uses of imagination',
    'Truth, fiction, and consequence',
    null
  )
on conflict (id) do nothing;

commit;
