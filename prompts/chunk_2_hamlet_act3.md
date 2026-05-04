@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for Hamlet, ids qm_ham_007 to
qm_ham_012, sort_order 70 to 120.

QUOTES (in this order):

7. id qm_ham_007, sort_order 70
   "Get thee to a nunnery"
   Hamlet to Ophelia, Act 3 Sc 1
   is_core_quote: true, retrieval_priority: 5

8. id qm_ham_008, sort_order 80
   "The lady doth protest too much, methinks"
   Gertrude, Act 3 Sc 2
   is_core_quote: false

9. id qm_ham_009, sort_order 90
   "O my offence is rank, it smells to heaven"
   Claudius, Act 3 Sc 3 (prayer soliloquy)
   is_core_quote: true, retrieval_priority: 6

10. id qm_ham_010, sort_order 100
    "I must be cruel only to be kind"
    Hamlet, Act 3 Sc 4 (closet scene)
    is_core_quote: false

11. id qm_ham_011, sort_order 110
    Ophelia's mad song — choose ONE representative lyric (e.g.
    "He is dead and gone, lady, / He is dead and gone" or
    "They bore him barefaced on the bier")
    Ophelia, Act 4 Sc 5
    is_core_quote: false

12. id qm_ham_012, sort_order 120
    "Alas, poor Yorick! I knew him, Horatio"
    Hamlet, Act 5 Sc 1 (graveyard scene)
    is_core_quote: true, retrieval_priority: 7

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: gender, surveillance, conscience, betrayal,
madness, death, appearance_reality.

AO4: every comparative_prompt must name a specific Duchess of Malfi moment.
Useful pairings to consider — Ophelia's mad songs against the Duchess's
controlled dignity in 4.2; Claudius's prayer against the Cardinal's hollow
piety in 5.4–5.5; Yorick's skull against Bosola's "box of worm-seed".

Output the JSON array only.
