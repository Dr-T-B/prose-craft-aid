# Runtime Table Import Plan (Critical Fix Phase)

## Purpose

Populate the existing runtime tables in Supabase so authenticated users see the full dataset instead of the minimal seed.

This fixes the current regression where:
- Anonymous users → rich local dataset
- Signed-in users → sparse Supabase dataset

## Strategy

We do NOT introduce new tables yet.
We populate the tables the app already reads.

## Target Tables

- routes
- questions
- theses
- paragraph_jobs
- quote_methods
- comparative_matrix
- character_cards
- symbol_entries
- theme_maps
- ao5_tensions

## Source of Truth

Your Google Sheets datasets (2 spreadsheets already provided).

## Import Approach

### Step 1: Export each sheet to CSV
For each dataset tab:
- File → Download → CSV

### Step 2: Clean headers to match schema
Ensure column names match table fields exactly.

### Step 3: Use Supabase Table Editor OR SQL COPY

#### Option A (recommended for now):
Use Supabase Table Editor → Import CSV

#### Option B (later):
Use SQL `insert ... on conflict` batching

## Mapping Notes

### quote_methods
Map:
- quote → quote_text
- method → method
- effect → effect_prompt
- meaning → meaning_prompt
- themes → best_themes (array)

### questions
Map:
- family → family
- stem → stem
- route → primary_route_id

### theses
Ensure:
- route_id exists first
- theme_family matches question family

### paragraph_jobs
Ensure:
- route_id valid
- question_family matches

## Critical Rule

Always import in this order:

1. routes
2. questions
3. theses
4. paragraph_jobs
5. quote_methods
6. comparative_matrix
7. character_cards
8. symbol_entries
9. theme_maps
10. ao5_tensions

## Validation Queries

Run after import:

```sql
select count(*) from quote_methods;
select count(*) from questions;
select count(*) from theses;
```

Compare counts to Google Sheets.

## Success Condition

Authenticated users see full dataset identical to local seed.

## Do NOT do yet

- Do not create library_* tables
- Do not remove fallback logic
- Do not redesign schema

Fix the data first.

## Next Phase

After this:
- Tier 1 structured library tables
- Edge Function importer
- removal of local fallback (optional)
