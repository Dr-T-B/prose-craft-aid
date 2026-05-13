# Archived AO5 Glossary Rows — 2026-05-13

Rows hard-deleted from `glossary_terms` as part of pre-exam AO5 remediation
(Component 2 / 9ET0/02 assesses AO1–AO4 only). All rows had `is_active = false`.

The lens definitions (feminist, Marxist, postmodern, trauma) remain useful as
AO1 interpretive lenses and may be repurposed under AO1 framing in future.

## Backup

| id | term | category | ao_tags | level_band | sort_order | is_active | source_row_key | definition |
|----|------|----------|---------|------------|------------|-----------|----------------|------------|
| gt-exam-ao5 | AO5 — Explore interpretations | exam_term | AO5 | strong | 540 | false | exam_ao5 | NOT ASSESSED in Pearson Edexcel 9ET0/02 Component 2: Prose. AO5 applies to other components only. In Component 2, interpretive sophistication is credited under AO1 — argue alternative readings as part of your personal, informed response. |
| gt-lens-feminist | Feminist reading | ao5_lens | AO5 | strong | 400 | false | lens_feminist | Examines how texts construct, constrain, or challenge female identity, agency, and experience — drawing attention to gender as a structuring force in narrative and society. |
| gt-lens-marxist | Marxist reading | ao5_lens | AO5 | strong | 410 | false | lens_marxist | Examines how texts represent class conflict, economic power, and the ideological structures that sustain inequality — asking whose interests the narrative serves. |
| gt-lens-postmodern | Postmodern / deconstructive reading | ao5_lens | AO5 | top_band | 420 | false | lens_postmodern | Questions the stability of meaning, the reliability of narrative, and the text's own claim to represent reality — asking how the text undermines the certainties it appears to assert. |
| gt-lens-trauma | Trauma theory reading | ao5_lens | AO5 | top_band | 430 | false | lens_trauma | Examines how texts represent psychological and historical trauma — including its symptoms (fragmentation, repetition, delayed understanding) and the possibility or impossibility of recovery. |

## Full row data (JSON)

```json
[
  {
    "id": "gt-exam-ao5",
    "term": "AO5 — Explore interpretations",
    "category": "exam_term",
    "definition": "NOT ASSESSED in Pearson Edexcel 9ET0/02 Component 2: Prose. AO5 applies to other components only. In Component 2, interpretive sophistication is credited under AO1 — argue alternative readings as part of your personal, informed response.",
    "what_to_notice": "Do not attempt to score AO5 marks in Component 2. Instead, embed alternative readings into your AO1 argument using the safe stem: \"Alternatively, one might argue that...\"",
    "best_verbs": [],
    "example_ht": null,
    "example_at": null,
    "sentence_stem": "Introduce an alternative reading, engage with it, then evaluate it against your own argument.",
    "theme_links": [],
    "ao_tags": ["AO5"],
    "level_band": "strong",
    "sort_order": 540,
    "is_active": false,
    "source_row_key": "exam_ao5",
    "created_at": "2026-04-26 12:43:28.579171+00",
    "updated_at": "2026-04-26 12:43:28.579171+00",
    "student_friendly_definition": null,
    "common_misuse_warning": null
  },
  {
    "id": "gt-lens-feminist",
    "term": "Feminist reading",
    "category": "ao5_lens",
    "definition": "Examines how texts construct, constrain, or challenge female identity, agency, and experience — drawing attention to gender as a structuring force in narrative and society.",
    "what_to_notice": "Ask: how does the text position women? Are female characters defined by their relationship to men? Do they have interiority? How does the narrative treat female suffering or desire?",
    "best_verbs": ["positions", "constrains", "enables", "challenges", "exposes"],
    "example_ht": "Louisa's repressed inner life; Mrs Gradgrind's erasure; Sissy as idealised \"angel in the house\".",
    "example_at": "Briony's narrative authority as a female child; Cecilia's constrained agency within class and family.",
    "sentence_stem": "A feminist reading would argue that {writer} {verb} female experience as {reading}.",
    "theme_links": ["gender", "repression", "power", "identity"],
    "ao_tags": ["AO5"],
    "level_band": "strong",
    "sort_order": 400,
    "is_active": false,
    "source_row_key": "lens_feminist",
    "created_at": "2026-04-26 12:43:28.579171+00",
    "updated_at": "2026-04-26 12:43:28.579171+00",
    "student_friendly_definition": null,
    "common_misuse_warning": null
  },
  {
    "id": "gt-lens-marxist",
    "term": "Marxist reading",
    "category": "ao5_lens",
    "definition": "Examines how texts represent class conflict, economic power, and the ideological structures that sustain inequality — asking whose interests the narrative serves.",
    "what_to_notice": "Focus on class positions, economic systems, and whether the text challenges or reinforces the status quo. Who is rewarded? Who suffers? Is the ending ideologically conservative or radical?",
    "best_verbs": ["exposes", "critiques", "reinforces", "reproduces", "challenges"],
    "example_ht": "Coketown as capitalist exploitation; Bounderby as predatory bourgeoisie; Stephen as the virtuous but powerless proletariat.",
    "example_at": "Robbie as a class victim whose education provides aspiration but no protection; Marshall's immunity to consequence.",
    "sentence_stem": "A Marxist reading positions {element} as an expression of {class dynamic}.",
    "theme_links": ["class", "power", "injustice", "systems"],
    "ao_tags": ["AO5"],
    "level_band": "strong",
    "sort_order": 410,
    "is_active": false,
    "source_row_key": "lens_marxist",
    "created_at": "2026-04-26 12:43:28.579171+00",
    "updated_at": "2026-04-26 12:43:28.579171+00",
    "student_friendly_definition": "Dickens mocking characters or institutions using exaggeration and humour to criticise",
    "common_misuse_warning": "Not all humour is satire. Satire requires a critical target and a moral purpose behind the mockery."
  },
  {
    "id": "gt-lens-postmodern",
    "term": "Postmodern / deconstructive reading",
    "category": "ao5_lens",
    "definition": "Questions the stability of meaning, the reliability of narrative, and the text's own claim to represent reality — asking how the text undermines the certainties it appears to assert.",
    "what_to_notice": "Look for moments of self-contradiction, narrative unreliability, or formal play that destabilises a unified reading. Most applicable to Atonement; can be applied to Hard Times through Dickens's unreliable satirical narrator.",
    "best_verbs": ["deconstructs", "destabilises", "undermines", "problematises", "questions"],
    "example_ht": "Dickens's satirical narrator is not neutral — its moralising voice is itself an ideological construction.",
    "example_at": "The coda deconstructs the \"truth\" of the preceding narrative; the novel cannot be read as realism after the revelation.",
    "sentence_stem": "A deconstructive reading would argue that {element} {verb} the text's own {claim/certainty}.",
    "theme_links": ["truth", "narrative", "authorship", "epistemology"],
    "ao_tags": ["AO5"],
    "level_band": "top_band",
    "sort_order": 420,
    "is_active": false,
    "source_row_key": "lens_postmodern",
    "created_at": "2026-04-26 12:43:28.579171+00",
    "updated_at": "2026-04-26 12:43:28.579171+00",
    "student_friendly_definition": null,
    "common_misuse_warning": null
  },
  {
    "id": "gt-lens-trauma",
    "term": "Trauma theory reading",
    "category": "ao5_lens",
    "definition": "Examines how texts represent psychological and historical trauma — including its symptoms (fragmentation, repetition, delayed understanding) and the possibility or impossibility of recovery.",
    "what_to_notice": "Trauma theory is most directly relevant to Atonement: Robbie's war sections use fragmentation and intrusive memory. Briony's entire narrative can be read as a traumatic re-telling.",
    "best_verbs": ["registers", "enacts", "represents", "symptomatises", "processes"],
    "example_ht": "Stephen Blackpool's suffering as social trauma that the system refuses to acknowledge.",
    "example_at": "Robbie's fragmented war consciousness; Briony's lifetime of narrative reconstruction as trauma response.",
    "sentence_stem": "A trauma reading positions {character/section} as {symptom/enactment} of unresolved {loss/guilt}.",
    "theme_links": ["memory", "suffering", "guilt", "truth"],
    "ao_tags": ["AO5"],
    "level_band": "top_band",
    "sort_order": 430,
    "is_active": false,
    "source_row_key": "lens_trauma",
    "created_at": "2026-04-26 12:43:28.579171+00",
    "updated_at": "2026-04-26 12:43:28.579171+00",
    "student_friendly_definition": null,
    "common_misuse_warning": null
  }
]
```
