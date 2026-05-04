@quote_bank_master.md

TASK: Generate exactly 6 quote_methods objects for The Duchess of Malfi,
ids qm_duch_001 to qm_duch_006, sort_order 10 to 60.

QUOTES (in this order):

1. id qm_duch_001, sort_order 10
   "Why should only I, of all the other princes of the world, / Be cased up
   like a holy relic?"
   Duchess, Act 1 Sc 1
   is_core_quote: false

2. id qm_duch_002, sort_order 20
   "This is flesh and blood, sir; / 'Tis not the figure cut in alabaster /
   Kneels at my husband's tomb"
   Duchess, Act 1 Sc 1 (wooing of Antonio)
   is_core_quote: true, retrieval_priority: 4

3. id qm_duch_003, sort_order 30
   "You are a widow; / You know already what man is"
   Ferdinand, Act 1 Sc 1
   is_core_quote: true, retrieval_priority: 5

4. id qm_duch_004, sort_order 40
   "I would have their bodies / Burnt in a coal-pit"
   Ferdinand, Act 2 Sc 5
   is_core_quote: false

5. id qm_duch_005, sort_order 50
   "Whether the spirit of greatness or of woman / Reign most in her, I know
   not which is greater"
   Bosola of the Duchess, Act 3 Sc 2 (bedchamber scene)
   is_core_quote: true, retrieval_priority: 7

6. id qm_duch_006, sort_order 60
   "What witchcraft doth he practise, that he hath left / A dead man's hand
   here?"
   Duchess (responding to the dead hand), Act 4 Sc 1
   is_core_quote: false

THEME COVERAGE FOR THIS CHUNK: across these 6 quotes ensure best_themes
arrays collectively touch: gender, patriarchal_control, identity, power,
corruption, surveillance.

AO4: every comparative_prompt must name a specific Hamlet scene, character
moment, or technique. Useful pairings — the Duchess's wooing in 1.1 against
Ophelia's silenced courtship in 3.1; Ferdinand's incestuous fixation against
Hamlet's closet-scene rage at Gertrude in 3.4; the dead hand against Yorick's
skull in 5.1.

Output the JSON array only.
