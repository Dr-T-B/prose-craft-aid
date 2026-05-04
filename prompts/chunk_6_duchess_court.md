@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for The Duchess of Malfi,
ids qm_duch_013 to qm_duch_018, sort_order 130 to 180.

QUOTES (in this order). Use Webster's exact wording from the standard
edition (Revels / New Mermaids):

13. id qm_duch_013, sort_order 130
    Antonio's opening speech on the corruption of courts (Act 1 Sc 1) —
    select the lines comparing the French court's purgation of "flatt'ring
    sycophants" with the diseased Italian court.
    Antonio, Act 1 Sc 1
    is_core_quote: false

14. id qm_duch_014, sort_order 140
    "The weakest arm is strong enough that strikes / With the sword of
    justice"
    Bosola (or attribute to correct speaker), late in Act 5
    is_core_quote: false

15. id qm_duch_015, sort_order 150
    "Diamonds are of most value, / They say, that have passed through most
    jewellers' hands"
    Duchess, Act 1 Sc 1
    is_core_quote: false

16. id qm_duch_016, sort_order 160
    "He and his brother are like plum trees that grow crooked over standing
    pools"
    Bosola of the Cardinal and Ferdinand, Act 1 Sc 1
    is_core_quote: false

17. id qm_duch_017, sort_order 170
    Cardinal on ambition — select a representative line on his political
    appetites (e.g. from Act 1 Sc 1 or his soliloquy on conscience in
    Act 5 Sc 5)
    Cardinal
    is_core_quote: false

18. id qm_duch_018, sort_order 180
    "A politician is the devil's quilted anvil; / He fashions all sins on
    him, and the blows are never heard"
    Bosola, Act 3 Sc 2
    is_core_quote: false

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: corruption, power, surveillance, betrayal,
gender, patriarchal_control.

VERIFY ACROSS ALL 18 DUCHESS QUOTES (chunks 4–6): the following themes must
each appear in best_themes at least twice — gender, power, death, madness,
corruption, identity, betrayal, revenge, surveillance, patriarchal_control.
Distribute themes in this chunk to fill any gaps left by chunks 4 and 5.

AO4: every comparative_prompt must name a specific Hamlet moment. Strong
pairings — Antonio's French-court speech against "Something is rotten in
the state of Denmark"; "plum trees" against Hamlet's "unweeded garden";
"devil's quilted anvil" against Claudius's hidden offence ("O my offence is
rank") or Polonius as plotter.

Output the JSON array only.
