@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for Hamlet, ids qm_ham_013 to
qm_ham_018, sort_order 130 to 180.

QUOTES (in this order):

13. id qm_ham_013, sort_order 130
    "The rest is silence"
    Hamlet, Act 5 Sc 2 (dying words)
    is_core_quote: true, retrieval_priority: 8

14. id qm_ham_014, sort_order 140
    "The play's the thing / Wherein I'll catch the conscience of the King"
    Hamlet, Act 2 Sc 2
    is_core_quote: true, retrieval_priority: 3

15. id qm_ham_015, sort_order 150
    "How all occasions do inform against me"
    Hamlet, Act 4 Sc 4 (Fortinbras soliloquy)
    is_core_quote: false

16. id qm_ham_016, sort_order 160
    "There is nothing either good or bad but thinking makes it so"
    Hamlet to Rosencrantz, Act 2 Sc 2
    is_core_quote: false

17. id qm_ham_017, sort_order 170
    "Now might I do it pat, now he is praying"
    Hamlet, Act 3 Sc 3
    is_core_quote: false

18. id qm_ham_018, sort_order 180
    "This above all: to thine own self be true"
    Polonius, Act 1 Sc 3
    is_core_quote: false

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: inaction, revenge, conscience, appearance_reality,
identity, surveillance.

VERIFY ACROSS ALL 18 HAMLET QUOTES (chunks 1–3): the following themes must
each appear in best_themes at least twice — madness, death, revenge, gender,
corruption, appearance_reality, surveillance, conscience, inaction, betrayal.
Distribute themes in this chunk to fill any gaps left by chunks 1 and 2.

AO4: every comparative_prompt must name a specific Duchess of Malfi moment.
Particularly useful pairings — Hamlet's "rest is silence" against the
Duchess's "Cover her face. Mine eyes dazzle"; the Mousetrap against the
"play" of madness staged for the Duchess in 4.2; "How all occasions do
inform against me" against Bosola's belated repentance in 5.2.

Output the JSON array only.
