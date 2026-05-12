# Drama Contamination Audit — prose-craft-aid

_Audit date: 2026-05-12. Read-only — no rows deleted, no migrations reverted._

## Supabase project identity

- **prose-craft-aid** Supabase project ref: **`szdgsmpxtifrcmwelqfo`** (org `tucbisyjvigmwanvhpee`, region `eu-west-2`, created 2026-04-19).
- **drama-tutor** Supabase project ref: `lopjupwadwahkjyhghvb` (same org, region `eu-central-1`, created 2026-05-02).
- **These are SEPARATE Supabase projects.** The prose app and drama tutor do not share a database. Cross-project FK references are not possible. Contamination found below is therefore not "shared-DB pollution" — it is data and DDL that were **applied directly to the prose-app DB** even though they belong to Drama-Tutor territory.

## Migration / schema-drift state

| Local file in `supabase/migrations/` | Applied to prose-app DB? | Notes |
|---|---|---|
| `20240504000000_drama_scene_schema.sql` | **NO** | Creates `drama_scenes`, `drama_scene_themes`, `drama_scene_characters`, `drama_scene_ao2_methods`, `drama_scene_ao3_context`, `drama_scene_ao5_readings`, `drama_scene_essay_uses`, `drama_scene_ao1_arguments`, `drama_scene_ao4_connections` + seeds Hamlet 3.1. **Not in `supabase_migrations.schema_migrations`.** No corresponding tables exist in prod. |
| `20260505010059_expand_drama_themes_and_curation_status.sql` | **YES** (version `20260505010059`) | Rewrites `validate_themes()` to allow Drama theme tokens (`death, inaction, corruption, betrayal, appearance_reality, surveillance, revenge, madness, conscience, identity, power, patriarchal_control`) on prose-app `quote_methods` rows. Loosens `quote_methods.curation_status` CHECK. |

Two **applied** migrations are missing from the local repo:

| Applied version | Name | What it did |
|---|---|---|
| `20260506112410` | `create_drama_tutor_tables` | Created `drama_themes`, `drama_quote_clusters`, `drama_critics` (Drama Tutor product schema). |
| `20260506114518` | `create_drama_interpretive_routes_and_triggers` | Created `drama_interpretive_routes`, `drama_question_triggers` (Drama Tutor's question router). |

This is **schema drift**: prod has DDL that the migrations directory does not. Re-running `supabase db reset` against the local migration set would lose these tables.

## What the Drama migrations introduced

**Allowed-to-apply migration (`20260505010059`):**
- Modifies the prose-app's shared `validate_themes(text[])` constraint function to additionally accept the 12 Drama theme tokens listed above.
- Net effect: any prose-app insert into a themes-validated column can now legally tag a row with `revenge`, `madness`, `conscience`, etc. without rejection.
- Also: `quote_methods.curation_status` CHECK widened from its prior set to `('review','core','strong','good','draft')`. This is not Drama-specific but landed in the same migration.

**Should-not-have-applied migrations (drift, applied directly to prose-app DB):**
- `drama_themes` (16 rows) — master Drama theme index, scoped by `play` (`hamlet` / `duchess`). Self-contained, no FK into prose tables.
- `drama_quote_clusters` (55 rows) — Drama quote bank.
- `drama_critics` (48 rows) — AO5 critic positions for Drama Tutor (note: AO5 is the **Drama** AO; Component 2 Prose does NOT assess AO5).
- `drama_interpretive_routes` (16 rows) — H001–H008 Hamlet Section A routes, D001–D008 Duchess Section B routes.
- `drama_question_triggers` (36 rows) — keyword → Drama-route mapping.

All five Drama Tutor tables are **self-contained**: no FK column references prose-app tables, and no prose-app table FK-references them. They are query-isolated from the prose app **at the schema level**.

**Local-but-not-applied (`20240504000000`):**
- The original `drama_scene_*` set of nine tables — same naming family but a completely different shape from the Drama Tutor tables above (scene-grained vs. theme/route-grained). These never landed in prod, so they are inert today, but the file is still in the migrations directory and will execute against any fresh `supabase db reset`.

## DB audit — content tables

Scan strategy: for each content-bearing table, count rows whose text columns match Drama identifiers (`hamlet`, `duchess`, `malfi`, `webster`, `shakespeare`, plus character-name lists for character/symbol tables). Themes were probed separately with the 12 Drama theme tokens.

| Table | Total rows | Drama hits | Status |
|---|---:|---:|---|
| `quote_methods` | 2,425 | **36** (18 `source_text='hamlet'`, 18 `source_text='duchess'`) | 🔴 Active leak |
| `character_cards` | 21 | 0 | 🟢 Clean (12 Hard Times, 9 Atonement) |
| `symbol_entries` | 31 | 0 | 🟢 Clean (15 Hard Times, 16 Atonement) |
| `comparative_matrix` | 26 | 0 | 🟢 Clean |
| `theme_maps` | 9 | 0 | 🟢 Clean (none of the 12 Drama theme labels) |
| `theses` | 24 | 0 | 🟢 Clean |
| `paragraph_jobs` | 24 | 0 | 🟢 Clean |
| `paragraph_stems` | 50 | 0 | 🟢 Clean |
| `routes` | 8 | 0 | 🟢 Clean |
| `questions` | 40 | 0 | 🟢 Clean |
| `past_paper_questions` | 11 | 0 | 🟢 Clean |
| `ao5_tensions` | 16 | 0 | 🟡 Latent risk on AO grounds, not Drama (see below) |
| `glossary_terms` | 124 | 0 | 🟢 Clean |
| `library_context_bank` | 133 | 0 | 🟢 Clean |
| `thematic_axis_pairings` | 20 | 0 | 🟢 Clean |
| `quote_pairs` | 26 | 0 (no FK to any Hamlet/Duchess `quote_methods` row) | 🟢 Clean |
| `quote_question_links` | 144 | 0 (no link references a Drama `quote_methods` row) | 🟢 Clean |
| `axis_clusters` | 8 | 0 | 🟢 Clean |
| `drama_themes` | 16 | n/a — entire table is Drama | 🟡 Latent (Drama-Tutor table, query-isolated) |
| `drama_quote_clusters` | 55 | n/a | 🟡 Latent |
| `drama_critics` | 48 | n/a | 🟡 Latent |
| `drama_interpretive_routes` | 16 | n/a | 🟡 Latent |
| `drama_question_triggers` | 36 | n/a | 🟡 Latent |

### 🔴 Active leak — `quote_methods` (36 rows)

The 36 rows have `id` prefixed `qm_ham_*` (Hamlet, 18) and `qm_duch_*` (Duchess of Malfi, 18). Examples:

| id | source_text | quote_text (snippet) | best_themes (Drama tokens) |
|---|---|---|---|
| `qm_ham_001` | `hamlet` | "O that this too too solid flesh would melt" | death, inaction, corruption, gender |
| `qm_ham_003` | `hamlet` | "Something is rotten in the state of Denmark" | corruption, appearance_reality, surveillance |
| `qm_ham_006` | `hamlet` | "To be, or not to be – that is the question" | death, inaction, conscience, revenge |
| `qm_duch_007` | `duchess` | "I am Duchess of Malfi still" | identity, gender, power, death |
| `qm_duch_010` | `duchess` | "Cover her face. Mine eyes dazzle. She died young." | death, madness, gender, betrayal, power |

(Full list: `qm_ham_001`…`qm_ham_018`, `qm_duch_001`…`qm_duch_018`.)

**Why this is a 🔴 active leak, not 🟡 latent:**
- `quote_methods` is the prose-app's primary quote table (2,425 rows) and is read directly by `ContentAudit.tsx`, `ContentInspector.tsx`, `vocabularyAudit.ts`, library quote views, and seemingly every Tier-1 content surface.
- None of the existing audit/library code in `src/components/admin/*` or `src/lib/{datasets,contentRepo,libraryAdapters,vocabularyAudit}.ts` filters `quote_methods` by `source_text` to the prose-app's two configured texts (`Hard Times`, `Atonement`). An unfiltered `select * from quote_methods` will include the 36 Drama rows.
- The Drama theme tokens (`revenge`, `madness`, `conscience`, etc.) tagged on these rows are **allowed** by the post-2026-05-05 `validate_themes()` constraint, but they do not appear in the prose-app's `theme_maps` (9 rows, all prose themes). Any theme-driven aggregation that joins or groups by theme will surface unknown/orphan theme buckets.

**Mitigations already in place:**
- The 36 Drama `quote_methods` rows are **not** referenced by any `quote_pairs.hard_times_quote_id` / `atonement_quote_id` (0 hits) — so the comparative-pair UI does not surface them.
- The 36 Drama rows are **not** referenced by any `quote_question_links` row (0 hits) — so the question-router does not surface them.
- The contamination is therefore limited to surfaces that browse `quote_methods` directly (Quote Bank list, ContentInspector, ContentAudit, VocabularyAudit, any "all quotes" view).

### 🟡 Latent — `drama_*` tables (171 rows total)

These five tables are self-contained and have no FK into prose-app tables. They will only leak if:
- A new prose-app component is built that joins to them (very unlikely given naming), or
- A future migration adds an FK from a prose-app table to one of them.

Risk today: low. Risk multiplier: every time a developer reads `list_tables` they see "Drama Tutor" alongside the prose tables and may assume it's part of this product.

### 🟡 Latent — `ao5_tensions` (Component-2 AO scope, not Drama)

Not Drama contamination but worth noting alongside: `ao5_tensions` (16 rows) holds AO5-labelled records. AO5 is **not assessed in Component 2: Prose** (confirmed in `docs/component-2-spec-verification.md`). The table has a defensive comment redefining its display label to "AO1 — Alternative Readings", but the underlying name and the prose-app's audit configs still reference it as `ao5_tensions`. Cleanup is advisable but out of scope for Drama contamination remediation.

## Code-level audit

Files inspected:

- `src/components/admin/ContentAudit.tsx` — audits 10 content tables (`questions`, `quote_methods`, `ao5_tensions`, `theme_maps`, `theses`, `paragraph_jobs`, `character_cards`, `symbol_entries`, `comparative_matrix`, `routes`). Each table read in full (`select * limit 500`), no `source_text` filter, no Drama exclusion. Findings: 🟢 no Drama identifiers in source; 🔴 will surface the 36 Drama `quote_methods` rows when the audit runs (they will be flagged as low-quality if their fields are sparse, otherwise pass).
- `src/components/admin/ContentInspector.tsx` — same 10 tables. `source_text` is an optional filter chip per table (built from distinct values present in the data), so an admin can see "hamlet"/"duchess" appearing as filter options when inspecting `quote_methods`. 🔴 same root cause.
- `src/components/admin/VocabularyAudit.tsx` + `src/lib/vocabularyAudit.ts` — controlled-vocabulary audit across the same content tables. It treats `quote_methods.source_text` as a required classification field but does not enforce membership against a closed set (`{Hard Times, Atonement}`). 🔴 a Drama `source_text` like `hamlet` will appear as a "near-duplicate" or "low-frequency" outlier finding rather than as an out-of-scope contamination flag.
- `src/data/quotes/at/` and `src/data/quotes/ht/` — both contain only `.gitkeep`. 🟢 no content files at all, let alone Drama files.
- `src/data/seed.ts`, `src/lib/datasets.ts`, `src/lib/contentRepo.ts`, `src/lib/libraryAdapters.ts` — `grep -E "hamlet|malfi|duchess|webster|shakespeare|claudius|gertrude|ophelia|polonius|laertes|horatio|ferdinand|bosola|cardinal|cariola|drama_|HAM_T|MAL_T"` returns **0 matches** across these files. 🟢 no Drama identifiers in repo TypeScript.
- `src/pages/library/{Comparison,Context,Glossary,ParagraphStems,Questions,Quotes,ThesisParagraph,_shared}.tsx` — also 🟢 by grep. (Note: these files were not opened individually; the grep covered the import/data-shape surface, not their behaviour. If any of them reads `quote_methods` without `source_text` filtering, that's the same root cause as the admin surfaces above.)
- Only false positive across all greps: `src/stage1/sql/seed_thematic_axis.sql:812` mentions `melodrama` — a literary-method tag on a non-Drama prose row. Not contamination.

## Risk summary

| Finding | Class |
|---|---|
| 36 Drama rows in `quote_methods` reachable from every unfiltered prose-app query against that table | 🔴 Active leak |
| `validate_themes()` rewritten to permit Drama theme tokens on prose tables | 🔴 Active leak (constraint relaxation already merged) |
| Five `drama_*` tables present in prod (Drama Tutor schema living in prose DB) | 🟡 Latent risk |
| Two applied migrations (`20260506112410`, `20260506114518`) not in local `supabase/migrations/` — schema drift | 🟡 Latent risk (will silently undo on fresh `db reset`) |
| `20240504000000_drama_scene_schema.sql` sitting in local migrations but never applied to prod | 🟡 Latent risk (will create 9 unwanted Drama tables on fresh `db reset`) |
| `ao5_tensions` table present and audited even though AO5 is out of scope for Component 2 | 🟡 Latent risk (AO-scope, not Drama) |
| `character_cards`, `symbol_entries`, `comparative_matrix`, `theme_maps`, `theses`, `paragraph_jobs`, `paragraph_stems`, `routes`, `questions`, `past_paper_questions`, `glossary_terms`, `library_context_bank`, `thematic_axis_pairings`, `quote_pairs`, `quote_question_links`, `axis_clusters` | 🟢 No Drama rows |
| `src/data/quotes/{at,ht}/` | 🟢 Empty |
| TS source (`datasets`, `contentRepo`, `libraryAdapters`, `seed`, `pages/library/*`) | 🟢 No Drama identifiers |

**Headline counts:** 2 🔴 · 5 🟡 · 9 🟢 (table-level) — and `src/data/quotes/` is clean.

## Recommended remediation (NOT executed in this session)

Per the brief, no rows deleted and no migrations reverted. Suggested next steps for the remediation session, ordered by leverage:

1. **Delete the 36 Drama rows from `quote_methods`** (`qm_ham_*` × 18, `qm_duch_*` × 18). Verified safe: no `quote_pairs` or `quote_question_links` reference them. Implement as a forward migration, not a rollback.
2. **Scope-filter at the query layer** as defence-in-depth: every prose-app read of `quote_methods` (admin tools + library views) should filter `source_text in ('Hard Times', 'Atonement')` so any future Drama row that lands in this DB is invisible to the prose app. Cheaper to add an `is_active` / `text_id` discriminator than to police all SELECTs.
3. **Revert the Drama-theme expansion in `validate_themes()`** as a forward migration. Restore the prose-only theme set (`class, guilt, imagination, fact vs imagination, memory, childhood, gender, war, education`). Combine with row deletion in step 1 so no orphan-theme rows block the new constraint.
4. **Move the five Drama Tutor tables out of the prose DB.** Either drop them here (forward migration) and rely on the dedicated `lopjupwadwahkjyhghvb` Drama project, or — if they are genuinely shared — at minimum bring them back into the local migrations directory so prod and source agree. Right now they exist in prod with no local DDL.
5. **Delete `supabase/migrations/20240504000000_drama_scene_schema.sql`** from this repo. It was never applied; leaving it in place risks reintroducing Drama tables on `supabase db reset`. The drama-tutor project is the correct home for it if anywhere.
6. **Out-of-scope but worth flagging in the same PR:** rename / scope the `ao5_tensions` table to reflect the "AO1 — Alternative Readings" mapping the schema comment already prescribes, since AO5 is not a Component-2 AO.
