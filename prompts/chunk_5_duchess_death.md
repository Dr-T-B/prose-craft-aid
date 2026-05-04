@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for The Duchess of Malfi,
ids qm_duch_007 to qm_duch_012, sort_order 70 to 120.

QUOTES (in this order):

7. id qm_duch_007, sort_order 70
   "I am Duchess of Malfi still"
   Duchess, Act 4 Sc 2
   is_core_quote: true, retrieval_priority: 1

8. id qm_duch_008, sort_order 80
   "What would it pleasure me to have my throat cut with diamonds?"
   Duchess, Act 4 Sc 2
   is_core_quote: false

9. id qm_duch_009, sort_order 90
   "I know death hath ten thousand several doors / For men to take their
   exits"
   Duchess, Act 4 Sc 2
   is_core_quote: true, retrieval_priority: 3

10. id qm_duch_010, sort_order 100
    "Cover her face. Mine eyes dazzle. She died young."
    Ferdinand, Act 4 Sc 2
    is_core_quote: true, retrieval_priority: 2

11. id qm_duch_011, sort_order 110
    "Thou art a box of worm-seed, at best but a salvatory of green mummy"
    Bosola to the Duchess, Act 4 Sc 2
    is_core_quote: true, retrieval_priority: 6

12. id qm_duch_012, sort_order 120
    "We are merely the stars' tennis balls, struck and banded / Which way
    please them"
    Bosola, Act 5 Sc 5
    is_core_quote: true, retrieval_priority: 8

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: death, identity, power, gender, madness, revenge,
betrayal.

AO4: every comparative_prompt must name a specific Hamlet moment. Strongest
pairings — "I am Duchess of Malfi still" against Hamlet's "The rest is
silence" or his stable selfhood across the Yorick scene; "ten thousand
several doors" against "To be, or not to be"; "Cover her face" against
Hamlet's recoil at Yorick's skull; "stars' tennis balls" against "There is
nothing either good or bad but thinking makes it so" or "There's a divinity
that shapes our ends".

Output the JSON array only.
