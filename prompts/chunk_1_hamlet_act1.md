@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for Hamlet, ids qm_ham_001 to
qm_ham_006, sort_order 10 to 60.

QUOTES (in this order):

1. id qm_ham_001, sort_order 10
   "O that this too too solid flesh would melt"
   Hamlet, Act 1 Sc 2 (first soliloquy)
   is_core_quote: true, retrieval_priority: 2

2. id qm_ham_002, sort_order 20
   "Frailty, thy name is woman"
   Hamlet, Act 1 Sc 2
   is_core_quote: false

3. id qm_ham_003, sort_order 30
   "Something is rotten in the state of Denmark"
   Marcellus, Act 1 Sc 4
   is_core_quote: true, retrieval_priority: 4

4. id qm_ham_004, sort_order 40
   "The time is out of joint. O cursèd spite, / That ever I was born to set it right"
   Hamlet, Act 1 Sc 5
   is_core_quote: false

5. id qm_ham_005, sort_order 50
   "What a piece of work is a man"
   Hamlet, Act 2 Sc 2
   is_core_quote: false

6. id qm_ham_006, sort_order 60
   "To be, or not to be – that is the question"
   Hamlet, Act 3 Sc 1
   is_core_quote: true, retrieval_priority: 1

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: corruption, gender, revenge, inaction,
appearance_reality, death, conscience.

AO4: every comparative_prompt must name a specific Duchess of Malfi scene,
character moment, or technique (e.g. Bosola's "stars' tennis balls" 5.5,
Ferdinand's "burnt in a coal-pit" 2.5, the Duchess's wooing 1.1).

Output the JSON array only.
