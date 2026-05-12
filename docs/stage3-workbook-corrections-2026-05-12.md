# Stage 3 — Workbook AO5 Correction Report
**Date:** 2026-05-12  
**Scope:** Component 2 Prose (9ET0/02) — AO1, AO2, AO3, AO4 only. AO5 not assessed.  
**Method:** Google Apps Script run from authenticated browser session.  
**Script project:** `stage3-ao5-corrections` (Untitled project, Google Apps Script)

---

## File 1 — Hard Times Chapter-to-Exam Matrix
**Spreadsheet ID:** `1kKOyAki8s8MmT0t69kDY5ZfkbsvYkXYnWuw90mqhZX0`  
**Title confirmed:** Hard Times Chapter-to-Exam Matrix - Edexcel Component 2 Prose

### Changes applied

| Spec | Location | Before | After |
|------|----------|--------|-------|
| (a) | Tab: Hard Times Matrix, R1C9 | `AO5 interpretation` | `Interpretive position` |
| (b) | Tab: WP4 Paragraph Engine, R1C7 | `Interpretation (AO5)` | `Interpretation` |
| (c) | Tab: Final Layer - Exam Simulation + Marking, col 9 | column `AO5 Score (5)` | **deleted** |
| (d) | Tab: Adaptive Intelligence Layer, col 7 | column `AO5` | **deleted** |
| (e/f) | Tab: WP4 Paragraph Engine, R15C8 | contained `AO5` text reference | AO5 clause stripped |
| (e/f) | Tab: WP5 Essay Generator, R2C9 | `AO1 conceptual; AO2 integrated; AO3 light; AO4 consistent; AO5 strong` | `AO1 conceptual; AO2 integrated; AO3 light; AO4 consistent` |
| (e/f) | Tab: WP5 Essay Generator, R3C9, R4C9, and further rows | AO Coverage arrays listing AO5 | AO5 stripped from each array |
| (e/f) | Tab: WP5 Essay Generator, R8C8, R9C8 | Timing/planning cells referencing AO5 | AO5 clause stripped |
| (e/f) | Tab: Final Layer, R2C12 | `Develop AO2 terminology; deepen AO5` | `Develop AO2 terminology; deepen` |

**Note on spec item (c) — Total formula update:** The script searched for `/25` patterns in the Final Layer tab before deleting the column. No `/25` Total formulas were found — the scoring total may use a different formula pattern or be a static value. Manual verification of any total/percentage cells in the Final Layer tab is recommended.

---

## File 2 — Master Comparative Matrix
**Spreadsheet ID:** `1JrtZpmQL9tFcj2Tjn0hI-bAm_vXQQX3KKJqSYwcpTc0`  
**Title confirmed:** Hard_Time_Atonement_Master_Comparative_Matrix

### Changes applied

All 5 spec-required changes confirmed in execution log:

| Spec | Row ID | Cell | Before | After |
|------|--------|------|--------|-------|
| (a) | M021 | R26C16 (student notes) | `Good for AO5 discussion.` | `Strong conceptual row.` |
| (b) | M071 | R76C16 (student notes) | `Top-tier AO2/AO5 row.` | `Top-tier AO2 row.` |
| (c) | M083 | R88C15 (related stems) | `Storytelling; truth; AO5` | `Storytelling; truth` |
| (d) | M116 | R121C4 (Focus/Stem) | `If the question invites AO5 / critical debate` | `If the question invites an interpretive or evaluative argument` |
| (e) | M116 | R121C11 (body cell) | `text-level AO5` | `interpretive and evaluative` |
| (e) | M116 | R121C12 (body cell) | `AO5 works best when tied to a method already in the paragraph.` | `Interpretive moves are strongest when tied to a method already in the paragraph. A student's own analytical position, clearly argued, distinguishes A from A*.` |
| (e) | M116 | R121C15 (body cell) | `AO5` | `interpretive depth` |

**Note:** Row numbers in the spreadsheet (R26, R76, R88, R121) differ from M-IDs (M021, M071, M083, M116) because M-IDs are stored as data in a column, not as row indices.

---

## File 3 — WP2 Final Master Workbook
**Spreadsheet ID:** `1yqvRRn53y8qZsPyjQxV-CRcusMQ9MyoAz-eTKWpM-gY`  
**Title confirmed:** WP2_final_master_workbook_26042026

### Audit findings
The following tabs contained AO5 references:

| Tab | Type of hit |
|-----|-------------|
| `04_AO5_INTERPRETATIONS` | Tab name itself; R1C1 contained tab name reference |
| `00_START_HERE` | R7C2 — tab name reference |
| `01_WORKBOOK_MAP` | R8C2 (standalone `AO5`), R8C3 (tab name reference) |
| `03_EXAM_DECODER` | 1 hit (minor) |
| `07_EXAMINER_WARNINGS` | 4 hits — teaching cells: "Vague AO5 / critic name-dropping", "AO5 becomes superficial", etc. |
| `08_QUOTE_PRIORITY_SYSTEM` | 3 hits — R10C4, R38C4, R40C7 (AO5 in comma arrays) |
| `09_TIMED_ESSAY_SYSTEM` | 1 hit — R33C1: "5. AO3 / AO5 integration" |
| `10_BLUEPRINT_NOTES` | 5 hits — mix of tab name references and content cells |
| `Master_Comparative_Matrix` | R88C14 (AO5 in array) |

### Changes applied

| Location | Change |
|----------|--------|
| Tab `04_AO5_INTERPRETATIONS` | **Renamed** → `04_INTERPRETIVE_POSITIONS` |
| `00_START_HERE` R7C2 | Tab name reference updated to `04_INTERPRETIVE_POSITIONS` |
| `01_WORKBOOK_MAP` R8C3 | Tab name reference updated to `04_INTERPRETIVE_POSITIONS` |
| `04_INTERPRETIVE_POSITIONS` R1C1 | Internal tab name reference updated |
| `08_QUOTE_PRIORITY_SYSTEM` R10C4 | AO5 stripped from comma array |
| `10_BLUEPRINT_NOTES` R10C3, R19C3, R28C3, R38C1, R55C2 | AO5 stripped / tab name reference updated |
| `Master_Comparative_Matrix` R88C14 | AO5 stripped from array |

### Judgment call — content cells not modified

The `04_INTERPRETIVE_POSITIONS` tab (formerly `04_AO5_INTERPRETATIONS`) contains substantive teaching content using "AO5" as a heading label — e.g., `AO5 RULE`, `AO5 DEBATE MATRIX`, `SAFE AO5 STEMS`, `COMMON AO5 ERRORS`. These are not column headers or AO arrays; they are row-label headings for pedagogical content.

Per the spec instruction ("tab rename if needed; column renames; array stripping — same pattern as Files 1 and 2"), these heading labels were left in place. They require a **manual rewrite pass** to rename headings as `INTERPRETIVE POSITION RULE`, `DEBATE MATRIX`, `SAFE INTERPRETIVE STEMS`, etc.

Similarly, `07_EXAMINER_WARNINGS` cells such as "Vague AO5 / critic name-dropping" and "A strong AO5 move is an argued alternative reading" are teaching prose — flagged for manual review but not stripped, as stripping would leave incomplete sentences.

---

## File 4 — AO4 Worksheet
**Spreadsheet ID:** `1y3JK5qTAdrySdQLuAhkDjFlcaHd58yTCeSFmom4GHNY`  
**Title confirmed:** Hard_Times_Atonement_AO4_Worksheet

### Audit result: **CLEAN**

Tab `AO4 Worksheet` contains no AO5 references. All stems correctly scoped to AO4 (connections and comparisons across texts). No stems found that mislabel critical perspectives or interpretive positions as AO4. No changes required.

---

## File 5 — WP4 Conceptual Language Pass
**Spreadsheet ID:** `1FjTeWD-WSGwX8b9TwZmtbVHZEno5CBuqZ8TDNyER188`  
**Title confirmed:** WP4 — CONCEPTUAL LANGUAGE PASS

### Audit result: **CLEAN**

All 8 tabs audited:

| Tab | Status |
|-----|--------|
| IMPLEMENTATION_NOTE | clean |
| Conceptual_Verbs_WP4 | clean |
| Theme_Reframing_WP4 | clean |
| Thesis_Bank_WP4 | clean |
| Paragraph_Development_WP4 | clean |
| Descriptive_to_Conceptual_WP4 | clean |
| Conceptual_Warnings_WP4 | clean |
| WP4_Correction_Log | clean |

No AO5 references in any column header, cell, or paragraph template. No changes required.

---

## Summary

| File | Title | Changes | Status |
|------|-------|---------|--------|
| File 1 | Hard Times Chapter-to-Exam Matrix | 2 column deletions, 2 header renames, AO5 stripped from ~8 AO-array cells | ✅ Applied |
| File 2 | Master Comparative Matrix | 7 cell corrections across M021, M071, M083, M116 | ✅ Applied |
| File 3 | WP2 Final Master Workbook | Tab renamed, 7 structural cells updated, 24 prose rewrites applied | ✅ Applied (audit: 20 residual — see Stage 3 manual rewrites section) |
| File 4 | AO4 Worksheet | None required | ✅ Clean |
| File 5 | WP4 Conceptual Language Pass | None required | ✅ Clean |

### Remaining manual work (File 3)
The `04_INTERPRETIVE_POSITIONS` tab still contains 7 row-label section headings (`AO5 DEBATE MATRIX`, `SAFE AO5 STEMS`, `COMMON AO5 ERRORS`, `FAST AO5 BUILD FORMULA`, etc.) that require retitling. A follow-on pass is also needed for `06_ATONEMENT_METAFICTION`, the embedded `Master_Comparative_Matrix`, `Model_Paragraph_Frames`, and `Essay_Openings_Thesis_Bank` tabs (not in Stage 3 scope). One targeted fix required: `09_TIMED_ESSAY_SYSTEM` R33C1 (`5. AO3 / AO5 integration` → `5. AO3 / interpretive integration`).

---

## Stage 3 manual rewrites completed (2026-05-12)

**Script:** `applyRewrites()` run against spreadsheet `1yqvRRn53y8qZsPyjQxV-CRcusMQ9MyoAz-eTKWpM-gY`  
**Execution time:** 21:34:13 → 21:34:25  
**Result:** 24 cells rewritten, 1 miss

### Rewrites applied: 24 / 25

| # | Tab | Cell | Context | Result |
|---|-----|------|---------|--------|
| 1 | `01_WORKBOOK_MAP` | R8C2 | Category column AO5 row | ✅ |
| 2 | `01_WORKBOOK_MAP` | R8C4 | Best used when cell | ✅ |
| 3 | `03_EXAM_DECODER` | R30C2 | Step 7 instruction | ✅ |
| 4 | `04_INTERPRETIVE_POSITIONS` | R34C2 | Weak move table row 1 | ✅ |
| 5 | `04_INTERPRETIVE_POSITIONS` | R35C1 | Weak move row 2 — Weak move column | ✅ |
| 6 | `04_INTERPRETIVE_POSITIONS` | R35C3 | Weak move row 2 — Better move column | ✅ |
| 7 | `04_INTERPRETIVE_POSITIONS` | R36C1 | Weak move table row 3 | ✅ |
| 8 | `04_INTERPRETIVE_POSITIONS` | R37C2 | Weak move table row 4 | ✅ |
| 9–14 | `04_INTERPRETIVE_POSITIONS` | various | Stems table, purpose cell, rule heading, how-to steps | ✅ |
| 15 | `07_EXAMINER_WARNINGS` | R17C1 | Warning row — Weak habit | ✅ |
| 16 | `07_EXAMINER_WARNINGS` | R17C3 | Warning row — Why it loses marks | ✅ |
| 17 | `07_EXAMINER_WARNINGS` | R17C5 | Warning row — Model improved practice | ✅ |
| 18 | `07_EXAMINER_WARNINGS` | R17C6 | Warning row — Main AO affected column | ✅ |
| 19 | `08_QUOTE_PRIORITY_SYSTEM` | R38C4 | Final revelation row — Why high-value | ✅ |
| 20 | `08_QUOTE_PRIORITY_SYSTEM` | R40C7 | Briony final comments row — Model note | ✅ |
| 21 | `09_TIMED_ESSAY_SYSTEM` | R33C1 | 6-Minute Paragraph Model — Phase 5 | ❌ no match |
| 22 | `10_BLUEPRINT_NOTES` | R28C2 | Stage table — Stage 5 Action | ✅ |
| 23 | `10_BLUEPRINT_NOTES` | R10C2 | User type table — Student aiming for A* | ✅ |
| 24 | `10_BLUEPRINT_NOTES` | R63C2 | Final Workbook Formula | ✅ |
| 25 | `10_BLUEPRINT_NOTES` | R38C3 | Tab pairings — 04_INTERPRETIVE_POSITIONS row | ✅ |

**Miss [21]:** Script searched for bare `AO3 / AO5 integration`. Actual cell is `5. AO3 / AO5 integration` (numbered list prefix). Requires targeted fix: change find string to `5. AO3 / AO5 integration`.

### Audit result: 20 AO5 references remain

`auditRemaining()` run at 21:39:29 → 21:39:42.

| Tab | Cell(s) | Content (excerpt) | Category |
|-----|---------|-------------------|----------|
| `04_INTERPRETIVE_POSITIONS` | R7C1 | `AO5 DEBATE MATRIX` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R10C8 | `Model AO5 sentence move` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R23C1 | `SAFE AO5 STEMS` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R26C3 | `Introduces AO5 cleanly without sounding artificial` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R28C3 | `Converts AO5 into argument rather than summary` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R31C1 | `COMMON AO5 ERRORS` | Section heading — separate pass needed |
| `04_INTERPRETIVE_POSITIONS` | R43C1 | `FAST AO5 BUILD FORMULA` | Section heading — separate pass needed |
| `06_ATONEMENT_METAFICTION` | R7C9 | `Useful AO5 angle` | Outside Stage 3 prose scope |
| `06_ATONEMENT_METAFICTION` | R14C8 | `Character / method / AO5` | Outside Stage 3 prose scope |
| `09_TIMED_ESSAY_SYSTEM` | R33C1 | `5. AO3 / AO5 integration` | **Missed rewrite — number prefix** |
| `Master_Comparative_Matrix` | R26C15 | `Good for AO5 discussion.` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R76C15 | `Top-tier AO2/AO5 row.` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R82C12 | `Irony is often the cleanest bridge between AO2 and AO5.` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R121C3 | `If the question invites AO5 / critical debate` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R121C10 | `text-level AO5` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R121C11 | `AO5 works best when tied to a method already in the paragraph.` | WP2 embedded copy — outside Stage 3 scope |
| `Master_Comparative_Matrix` | R121C14 | `AO5` | WP2 embedded copy — outside Stage 3 scope |
| `Model_Paragraph_Frames` | R5C10 | `Extension / AO5 prompt` | Outside Stage 3 prose scope |
| `Essay_Openings_Thesis_Bank` | R20C9 | `Ideal for stretching A* students into AO5 territory.` | Outside Stage 3 prose scope |
| *(1 unconfirmed)* | — | — | Audit total = 20; 19 entries confirmed across log screenshots |

---

## Stage 3c — Final sweep completed (2026-05-12)

**Script:** `finalSweep()` run against spreadsheet `1yqvRRn53y8qZsPyjQxV-CRcusMQ9MyoAz-eTKWpM-gY`  
**Execution time:** 22:07:45 → 22:08:13  
**Result:** 20 cells found, 20 rewritten, 0 skipped

### Phase 3 audit result: ✅ AUDIT CLEAN — no AO5 references remain

### Rewrites applied: 20 / 20

| Tab | Cell | Before | After | Rule |
|-----|------|--------|-------|------|
| `04_INTERPRETIVE_POSITIONS` | R7C1 | `AO5 DEBATE MATRIX` | `INTERPRETATION DEBATE MATRIX` | heading: debate matrix |
| `04_INTERPRETIVE_POSITIONS` | R10C8 | `Model AO5 sentence move` | `Model interpretive sentence move` | phrase: sentence |
| `04_INTERPRETIVE_POSITIONS` | R23C1 | `SAFE AO5 STEMS` | `SAFE INTERPRETIVE STEMS` | heading: safe stems |
| `04_INTERPRETIVE_POSITIONS` | R26C3 | `Introduces AO5 cleanly without sounding artificial` | `Introduces interpretation cleanly without sounding artificial` | fallback |
| `04_INTERPRETIVE_POSITIONS` | R28C3 | `Converts AO5 into argument rather than summary` | `Converts interpretation into argument rather than summary` | fallback |
| `04_INTERPRETIVE_POSITIONS` | R31C1 | `COMMON AO5 ERRORS` | `COMMON INTERPRETIVE ERRORS` | heading: common errors |
| `04_INTERPRETIVE_POSITIONS` | R43C1 | `FAST AO5 BUILD FORMULA` | `FAST interpretation BUILD FORMULA` | fallback |
| `04_INTERPRETIVE_POSITIONS` | R43C2 | `This formula keeps AO5 concise, relevant, and high value.` | `This formula keeps interpretation concise, relevant, and high value.` | fallback |
| `06_ATONEMENT_METAFICTION` | R7C9 | `Useful AO5 angle` | `Useful interpretive angle` | phrase: angle |
| `06_ATONEMENT_METAFICTION` | R14C8 | `Character / method / AO5` | `Character / method / interpretation` | fallback |
| `09_TIMED_ESSAY_SYSTEM` | R33C1 | `5. AO3 / AO5 integration` | `5. AO3 / interpretive integration` | phrase: integration |
| `Master_Comparative_Matrix` | R26C15 | `Good for AO5 discussion.` | `Strong conceptual row.` | matrix M021 |
| `Master_Comparative_Matrix` | R76C15 | `Top-tier AO2/AO5 row.` | `Top-tier AO2 row.` | matrix M071 |
| `Master_Comparative_Matrix` | R82C12 | `Irony is often the cleanest bridge between AO2 and AO5.` | `Irony is often the cleanest bridge between AO2 and interpretation.` | fallback |
| `Master_Comparative_Matrix` | R121C3 | `If the question invites AO5 / critical debate` | `If the question invites an interpretive or evaluative argument` | matrix M116 stem |
| `Master_Comparative_Matrix` | R121C10 | `text-level AO5` | `interpretive and evaluative` | matrix M116 body |
| `Master_Comparative_Matrix` | R121C11 | `AO5 works best when tied to a method already in the paragraph.` | `interpretation works best when tied to a method already in the paragraph.` | phrase: work* |
| `Master_Comparative_Matrix` | R121C14 | `AO5` | `interpretation` | fallback |
| `Model_Paragraph_Frames` | R5C10 | `Extension / AO5 prompt` | `Extension / interpretation prompt` | fallback |
| `Essay_Openings_Thesis_Bank` | R20C9 | `Ideal for stretching A* students into AO5 territory.` | `Ideal for stretching A* students into interpretation territory.` | fallback |

**\* Note R121C11:** The M116-specific rule intended to expand this to the longer form ("Interpretive moves are strongest…") but the generic `\bAO5 work(s)?\b` rule matched first in the ordered rule chain, producing the shorter rewrite. The AO5 reference is removed; the cell is no longer non-compliant. Manual polish optional.

### Updated summary table

| File | Title | Changes | Status |
|------|-------|---------|--------|
| File 1 | Hard Times Chapter-to-Exam Matrix | 2 column deletions, 2 header renames, ~8 array cells stripped | ✅ Clean |
| File 2 | Master Comparative Matrix | 7 cell corrections | ✅ Clean |
| File 3 | WP2 Final Master Workbook | Tab renamed + structural fixes + 24 prose rewrites + 20 final sweep rewrites | ✅ **FULLY CLEAN** |
| File 4 | AO4 Worksheet | None required | ✅ Clean |
| File 5 | WP4 Conceptual Language Pass | None required | ✅ Clean |

---

## HT Quote Bank — Book III completion (2026-05-12)

**Script:** `applyAllFixes()` run against Book I (`1ZRkP9HWi2-u8wYsHrRIUnsYiPip4j15GFhGloYa0-CM`), Book II (`1J2OPO5udYNYUjpL2gGnyXjkFJRM3IAjnk4W0OQr0_MI`), Book III (`16oej2fd6ewMPNBqKv2IRqB5Bp8ROu9w5syTiRUIyz8I`)
**Execution time:** 23:10:01 → 23:10:06
**Result:** All 6 phases completed, audit clean

### Phase 1 — AO5 column header rename

| Book | Sheet | Column | Before | After |
|------|-------|--------|--------|-------|
| Book III | Book III Quote Bank | 17 | `AO5_interpretive_tension` | `Interpretive_position` |

**Note:** Books I and II returned no matches — the `AO5_interpretive_tension` header was absent from both. Either already renamed in a prior session or the column carries a different label. Phase 6 audit confirmed no `AO5_interpretive_tension` headers remain across any of the three books.

### Phase 2 — Book III row inventory

35 quote_id rows found before any changes.

### Phase 3 — Chapter 6 title correction

2 cells renamed: `The Star` → `The Starlight` (Chapter 6, column 5).

### Phase 4 — Fake chapter remap

| Old ID | Row | New ID | Chapter | Title |
|--------|-----|--------|---------|-------|
| HT_B3_C10_001 | 34 | HT_B3_C9_002 | 9 | Final |
| HT_B3_C10_002 | 35 | HT_B3_C9_003 | 9 | Final |
| HT_B3_C11_001 | — | HT_B3_C9_004 | 9 | Final |
| HT_B3_C11_002 | — | HT_B3_C9_005 | 9 | Final |
| HT_B3_C12_001 | — | HT_B3_C9_006 | 9 | Final |
| HT_B3_C12_002 | — | **DELETED** (duplicate of HT_B3_C9_001) | — | — |

5 rows renumbered to Ch 9 (Final); 1 duplicate deleted.

### Phase 5 — New quotes appended

12 quotes appended starting at row 36:

| ID | Ch | Title | Speaker | Theme |
|----|----|-------|---------|-------|
| HT_B3_C4_004 | 4 | Lost | Stephen | Justice / False accusation |
| HT_B3_C4_005 | 4 | Lost | Narrator | Exile / Class invisibility |
| HT_B3_C5_004 | 5 | Found | Stephen | Industrialism / Human cost |
| HT_B3_C5_005 | 5 | Found | Stephen | Industrialism / Class violence |
| HT_B3_C6_003 | 6 | The Starlight | Stephen | Faith / Transcendence |
| HT_B3_C6_004 | 6 | The Starlight | Stephen | Forgiveness / Class injustice |
| HT_B3_C6_005 | 6 | The Starlight | Stephen | Muddle / Death |
| HT_B3_C7_004 | 7 | Whelp-Hunting | Narrator | Compassion / Class |
| HT_B3_C7_005 | 7 | Whelp-Hunting | Narrator | Moral collapse / Disguise |
| HT_B3_C8_003 | 8 | Philosophical | Sleary | Imagination / Alternative morality |
| HT_B3_C8_004 | 8 | Philosophical | Bitzer | Education / Moral consequence |
| HT_B3_C8_005 | 8 | Philosophical | Sleary | Compassion / Counter-philosophy |

All 12 rows marked `A*` target grade; verification status noted per row.

### Phase 6 — Post-fix audit

| Check | Result |
|-------|--------|
| Book III total quote_id rows | **46** (35 − 1 deleted + 12 new) |
| Fake chapter ids (C10/C11/C12) remaining | ✅ None |
| AO5 column headers across all three books | ✅ None |
| Chapter 6 "The Star" cells remaining | ✅ None |

**Manual sort recommended:** Data → Sort sheet → Column A (A→Z) to restore chapter order. Header row stays at top automatically.
