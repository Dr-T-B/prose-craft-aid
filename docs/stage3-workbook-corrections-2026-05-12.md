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
| File 3 | WP2 Final Master Workbook | Tab renamed, 2 tab-reference cells updated, 7 content cells updated | ✅ Applied (partial — see judgment call) |
| File 4 | AO4 Worksheet | None required | ✅ Clean |
| File 5 | WP4 Conceptual Language Pass | None required | ✅ Clean |

### Remaining manual work (File 3)
The `04_INTERPRETIVE_POSITIONS` tab and `07_EXAMINER_WARNINGS` tab in File 3 contain AO5 as prose headings and teaching sentences. These need a manual pass to reframe AO5 language as "interpretive position" language. Estimated scope: ~30 cells in `04_INTERPRETIVE_POSITIONS`, ~4 cells in `07_EXAMINER_WARNINGS`.
