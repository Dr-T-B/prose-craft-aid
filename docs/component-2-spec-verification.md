# Component 2 (Prose) — Edexcel Spec Verification

_Source: [Pearson Edexcel Level 3 Advanced GCE in English Literature, Issue 11, August 2025](https://qualifications.pearson.com/content/dam/pdf/A%20Level/English%20Literature/2015/Specification%20and%20sample%20assessments/gce2015-a-level-eng-lit-spec.pdf), paper code **9ET0/02**. Fetched 2026-05-12._

## AOs assessed

Component 2 assesses **AO1, AO2, AO3, AO4**.

> "Students answer one comparative essay question from a choice of two on their studied theme (AO1, AO2, AO3, AO4 assessed)."

- **AO1** — informed personal response, concepts and terminology, coherent, accurate written expression.
- **AO2** — analyse ways in which meanings are shaped in literary texts.
- **AO3** — context: significance and influence of the contexts in which texts are written and received.
- **AO4** — connections across literary texts. **This is the AO that distinguishes Component 2 from every other examined component except the unseen-poem section of Paper 3.**
- **AO5 — NOT assessed in Component 2.** No "interpretations" or critical-debate marks are awarded.

The spec does not publish a per-AO mark split for Paper 2 in the "Qualification at a glance" section; the breakdown is in the "Breakdown of Assessment Objectives" table later in the spec. What is anchored here from primary sources is the **set of AOs in scope**: {AO1, AO2, AO3, AO4}.

## Question structure

- **One paper, single section.** No Section A / Section B split.
- **Choice of two questions per theme.** Students answer **one** comparative essay question chosen from two on the theme they studied.
- The question is **comparative across the two prose texts in a single answer** — not single-text-per-section. The two studied texts (at least one pre-1900) are compared inside one essay. This is why AO4 (connections across texts) applies.
- The theme is selected from a Pearson prescribed list (e.g. *Childhood* — pre-1900 *Hard Times* / *What Maisie Knew*; post-1900 *Atonement* / *The Color Purple*).

## Marks & duration

- **Duration:** 1 hour 15 minutes.
- **Total marks:** 40 (entire paper, single comparative essay).
- **Weighting:** 20% of the total A-Level qualification.
- **Conditions:** externally assessed, written examination, **open book** — clean copies of both prose texts permitted in the exam.
- **No unseen prose** is assessed in Component 2. Unseen material in this qualification appears only in Component 3 (unseen post-2000 poem in Section A).

## Comparative requirement

Comparison is the central structural feature of Component 2. From the spec:

> "Students will study aspects of prose via two thematically linked texts, at least one of which must be pre-1900. Literary study of both texts selected for this component should incorporate the links and connections between them, and the contexts in which they were written and received."

Both texts must be addressed in the single answer; AO4 explicitly assesses the connections drawn.

## Contrast with Component 1 (Drama)

For reference (so the AO contrast between Paper 1 and Paper 2 is explicit in this repo):

| Aspect | Component 1: Drama (9ET0/01) | Component 2: Prose (9ET0/02) |
|---|---|---|
| Duration | 2h 15m | 1h 15m |
| Total marks | 60 (35 Section A + 25 Section B) | 40 |
| Weighting | 30% | 20% |
| Structure | Two sections, one essay each | Single comparative essay |
| Section A AOs | **AO1, AO2, AO3, AO5** — Shakespeare, incorporating wider critical reading | n/a |
| Section B AOs | **AO1, AO2, AO3** — Other Drama (e.g. *Hamlet* is Shakespeare-side; *The Duchess of Malfi* is one of the Other Drama options) | n/a |
| Paper-wide AOs | **AO1, AO2, AO3, AO5** (AO5 Shakespeare section only). **AO4 is NOT assessed on Paper 1.** | **AO1, AO2, AO3, AO4** (AO5 NOT assessed) |
| Comparative? | No — single-text per section | Yes — both prose texts in one answer |

Verbatim from the spec for Paper 1:

> "Section A – Shakespeare: one essay question, incorporating ideas from wider critical reading (AO1, AO2, AO3, AO5 assessed)."
>
> "Section B – Other Drama: one essay question (AO1, AO2, AO3 assessed)."

## Implications for prose-craft-aid

1. **AO badges/filters required for Component 2 content:** AO1, AO2, AO3, **AO4**. AO4 is the headline AO of this paper and the whole product flow (thesis → paragraphs → comparative matrix → quote pairs) should foreground "connections between the two texts."
2. **AO5 must be OUT OF SCOPE for any Component 2 surface.** Any AO5-labelled item (e.g. the `ao5_tensions` table, AO5 reading lenses, "critical interpretations" badges) belongs to Component 1 Shakespeare territory and **must not leak into prose-app filters or routes**. The DB currently has an `ao5_tensions` table; for Component 2 work it should be filtered out at the prose-app query layer, not silently ranked alongside AO1–AO4 evidence.
3. **Comparative-first content shape.** The unit of evidence for Component 2 is a *pair* (one quote/idea per text) bound by a connection (echo, contrast, divergence) — hence the existing `quote_pairs` and `comparative_matrix` tables. Single-text quotes still exist but the highest-value records are paired.
4. **"At least one pre-1900" rule** is a hard constraint at the text level. The prose app's two configured texts — *Hard Times* (1854, pre-1900) and *Atonement* (2001, post-1900) — together with the prescribed theme *Childhood* satisfy this requirement, so the app does not need to enforce the pre-1900 rule at the query layer.
5. **No unseen-prose features needed.** Any "unseen passage" / "extract analysis" UI is out of spec for Paper 2 and should not be built or surfaced in prose-app navigation.
6. **40 marks / 1h 15m / single essay** sets realistic ceilings for in-app practice timing, scaffold density, and per-essay length targets — useful when sizing essay plans, paragraph counts, and quote-budget heuristics.
