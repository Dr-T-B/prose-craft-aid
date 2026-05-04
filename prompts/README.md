# Quote Bank Prompts

A modular prompt set for generating 36 fully-populated `quote_methods` rows for the Prose Craft Aid quote bank — 18 Hamlet, 18 Duchess of Malfi — split into six chunks of six quotes each.

## Files

```
prompts/
├── README.md                          # this file
├── quote_bank_master.md               # role, JSON schema, quality standards (shared)
├── chunk_1_hamlet_act1.md             # qm_ham_001–006, sort_order 10–60
├── chunk_2_hamlet_act3.md             # qm_ham_007–012, sort_order 70–120
├── chunk_3_hamlet_act5_additional.md  # qm_ham_013–018, sort_order 130–180
├── chunk_4_duchess_act1.md            # qm_duch_001–006, sort_order 10–60
├── chunk_5_duchess_death.md           # qm_duch_007–012, sort_order 70–120
└── chunk_6_duchess_court.md           # qm_duch_013–018, sort_order 130–180
```

## Why split

A single 36-quote generation call produces ~25 000–30 000 words of structured prose across 22 fields per object. The tail end loses density, AO4 comparatives flatten into formula, and fields silently truncate. Six chunks of six keep each call inside the high-quality envelope and let you regenerate any single chunk without redoing the rest.

## How the chunks compose

Each chunk pre-allocates `id`, `sort_order`, `is_core_quote`, and `retrieval_priority` so the chunks concatenate into a clean 36-object array with no collisions. Across all six chunks:

- Hamlet core quotes (8): `qm_ham_001, 003, 006, 007, 009, 012, 013, 014` → retrieval priorities 1–8
- Duchess core quotes (8): `qm_duch_002, 003, 005, 007, 009, 010, 011, 012` → retrieval priorities 1–8
- Theme coverage rules are enforced per-chunk and re-verified in chunks 3 and 6

## Workflow A — Claude Code (recommended)

The chunk files start with `@quote_bank_master.md`, which Claude Code inlines automatically when the prompt is loaded.

```bash
# from the repo root, assuming prompts/ is in the project root
claude --prompt-file prompts/chunk_1_hamlet_act1.md > out/chunk_1.json
claude --prompt-file prompts/chunk_2_hamlet_act3.md > out/chunk_2.json
claude --prompt-file prompts/chunk_3_hamlet_act5_additional.md > out/chunk_3.json
claude --prompt-file prompts/chunk_4_duchess_act1.md > out/chunk_4.json
claude --prompt-file prompts/chunk_5_duchess_death.md > out/chunk_5.json
claude --prompt-file prompts/chunk_6_duchess_court.md > out/chunk_6.json
```

If `@`-references resolve relative to the file location, place all chunk files in the same directory as `quote_bank_master.md` (i.e. as in this folder).

## Workflow B — claude.ai web / API (no `@`-resolver)

Paste the contents of `quote_bank_master.md` first, then paste the chunk file contents (skipping the `@quote_bank_master.md` line) below it. One conversation per chunk gives the cleanest output.

## Assembly

Concatenate the six JSON arrays into a single 36-object array:

```bash
jq -s 'add' out/chunk_1.json out/chunk_2.json out/chunk_3.json \
            out/chunk_4.json out/chunk_5.json out/chunk_6.json \
   > out/quote_bank.json
```

## Validation before import

```bash
# count objects
jq 'length' out/quote_bank.json
# expect 36

# count core quotes per text
jq '[.[] | select(.source_text == "hamlet" and .is_core_quote == true)] | length' out/quote_bank.json
jq '[.[] | select(.source_text == "duchess" and .is_core_quote == true)] | length' out/quote_bank.json
# expect 8 and 8

# id and source_row_key match in every object
jq '[.[] | select(.id != .source_row_key)] | length' out/quote_bank.json
# expect 0

# retrieval_priority 1–8 distinct for core quotes per text
jq '[.[] | select(.source_text == "hamlet" and .is_core_quote == true) | .retrieval_priority] | sort' out/quote_bank.json
jq '[.[] | select(.source_text == "duchess" and .is_core_quote == true) | .retrieval_priority] | sort' out/quote_bank.json
# expect [1,2,3,4,5,6,7,8] in both

# every required theme appears at least twice within each text
jq '[.[] | select(.source_text == "hamlet") | .best_themes[]] | group_by(.) | map({theme: .[0], count: length})' out/quote_bank.json
jq '[.[] | select(.source_text == "duchess") | .best_themes[]] | group_by(.) | map({theme: .[0], count: length})' out/quote_bank.json

# every Hamlet comparative_prompts mentions Duchess content (and vice versa)
jq '[.[] | select(.source_text == "hamlet") | select((.comparative_prompts | join(" ")) | test("Duchess|Bosola|Ferdinand|Cardinal|Antonio|Webster"; "i") | not)] | length' out/quote_bank.json
# expect 0
```

Then run:

```bash
npm run import-quotes
```

against `out/quote_bank.json` to push the rows into Supabase via the existing `scripts/importQuotes.ts` pipeline.

## Note on Duchess mandatory list

The original brief lists "I am Duchess of Malfi still" twice — once at item 1 (Act 1 Sc 1, "anticipate") and once at item 8 (Act 4 Sc 2). This prompt set treats these as one quote (Act 4 Sc 2 wording, in chunk 5), giving 12 unique mandatory + all 6 additional = 18 Duchess quotes. If you want a separate Act 1 anticipation entry, either:

1. Add it as a 19th quote in a follow-up call, or
2. Replace one of the chunk 6 additional quotes with it and rebalance.

## Iteration

If a chunk comes back weak — flat AO4, thin AO5, formulaic stems, missing themes — regenerate just that chunk. The pre-allocated IDs and sort_order mean the replacement slots into the assembled array unchanged.
