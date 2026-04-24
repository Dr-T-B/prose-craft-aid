# Tier 1 Library Import Smoke Test

## Purpose

Use this tiny, repeatable smoke test to verify the Tier 1 import path for `library_context_bank`:

raw CSV -> Data Manager dry run -> `staged_changes` staging -> Review Queue display -> `apply-staged-change` -> `library_context_bank` upsert by `content_hash`.

This procedure uses one row only. It must not be used for bulk import validation.

## Preconditions

- You are signed in as an admin.
- The Supabase migrations for Tier 1 library tables and staged-change compatibility columns have been applied.
- The `apply-staged-change` edge function is deployed with library `content_hash` upsert support.
- The Data Manager Import UI and Review Queue changes are deployed.
- Do not run the cleanup SQL until you intentionally want to remove the smoke-test row.

## Fixture

The same CSV is available at:

`src/lib/__fixtures__/tier1-library-context-smoke.csv`

```csv
context_point,source_text,context_type,theme_tags,ao_tags,exam_use,notes
"Dickens writes within a Victorian industrial context in which utilitarian educational theory is associated with emotional repression and social control.","Hard Times","historical","education; utilitarianism; social control","AO3; AO4","Useful for questions on education, power, social systems, and imagination versus fact.","Smoke-test row for Tier 1 migration."
```

## UI Steps

1. Open `Data Manager -> Imports`.
2. In `Tier 1 Library Import`, select `Library Context Bank`.
3. Optionally enter source metadata:
   - `sourceDataset`: `tier1-smoke-test`
   - `sourceSheet`: `manual-smoke`
   - `sourceUrl`: leave blank or add the test source URL
   - `sourceSheetId`: leave blank or add the test sheet id
4. Paste the sample CSV into the CSV rows textarea.
5. Click `Dry Run`.

## Expected Dry-Run Results

- `rows_total = 1`
- `rows_valid = 1`
- `rows_warning = 0`
- `rows_invalid = 0`
- A `content_hash` is generated.
- `theme_tags` is parsed as an array:
  - `education`
  - `utilitarianism`
  - `social control`
- `ao_tags` is parsed as an array:
  - `AO3`
  - `AO4`
- The sample prepared row contains `normalizedPayload.content_hash`.

## Stage Valid Rows

1. Click `Stage Valid Rows`.
2. Confirm the UI reports one staged row.
3. Confirm it shows an import log id.
4. Do not expect a row in `library_context_bank` yet. Staging only writes to `import_logs` and `staged_changes`.

Expected `staged_changes` fields:

- `target_table = 'library_context_bank'`
- `operation = 'upsert'`
- `validation_status = 'valid'`
- `status = 'pending'`
- `source_row_number = 2`
- `content_hash` is non-empty.
- `dedupe_key` is non-empty and includes the content hash.
- `import_log_id` is non-empty.
- `normalized_payload` contains `content_hash`.
- `normalized_payload->'theme_tags'` is a JSON array.
- `normalized_payload->'ao_tags'` is a JSON array.
- `proposed_patch` mirrors the normalized payload for Review Queue compatibility.
- `source_payload` preserves the original CSV row.

Optional verification SQL:

```sql
select
  id,
  target_table,
  operation,
  validation_status,
  status,
  source_row_number,
  content_hash,
  dedupe_key,
  import_log_id,
  normalized_payload->>'notes' as notes
from public.staged_changes
where target_table = 'library_context_bank'
  and (
    normalized_payload->>'notes' ilike '%Smoke-test row for Tier 1 migration%'
    or proposed_patch->>'notes' ilike '%Smoke-test row for Tier 1 migration%'
  )
order by created_at desc;
```

## Review Queue

1. Open `Data Manager -> Review queue`.
2. Keep status filter on `Pending`, or filter table to `library_context_bank`.
3. Confirm the staged row appears.

Expected Review Queue display:

- `target_table` shows `library_context_bank`.
- Operation shows `upsert`.
- Validation badge shows `valid`.
- Source row shows `row 2`.
- Content hash is visible in shortened form.
- Dedupe key and import log id are visible in shortened form.
- Primary preview shows the `context_point` text because `context_title` is absent.
- Detail view shows:
  - `source_row_number`
  - `operation`
  - `validation_status`
  - `content_hash`
  - `dedupe_key`
  - `import_log_id`
  - readable `normalized_payload`
  - readable `source_payload`
  - validation notes stating no errors or warnings

## Apply

1. In the Review Queue detail panel, click `Approve`.
2. Confirm the existing `apply-staged-change` call succeeds.
3. Confirm the staged change status updates according to the current convention, normally `applied`.
4. Confirm `reviewed_at` is set. If the database includes `applied_at` and the apply function has been extended to set it, confirm that too; otherwise `reviewed_at` is the current compatibility timestamp.
5. Confirm a row exists in `library_context_bank` with the same `content_hash`.

Verification SQL:

```sql
select id, context_point, content_hash
from public.library_context_bank
where context_point ilike '%Smoke-test row for Tier 1 migration%'
   or notes ilike '%Smoke-test row for Tier 1 migration%';
```

If the context text does not include the smoke-test phrase, search by notes:

```sql
select id, context_point, notes, content_hash
from public.library_context_bank
where notes ilike '%Smoke-test row for Tier 1 migration%';
```

## Rollback / Cleanup SQL

Do not run this automatically. Use it only when you intentionally want to remove the smoke-test artifacts.

First inspect what will be removed:

```sql
select id, context_point, content_hash
from public.library_context_bank
where context_point ilike '%Smoke-test row for Tier 1 migration%'
   or notes ilike '%Smoke-test row for Tier 1 migration%';
```

Delete the final library row:

```sql
delete from public.library_context_bank
where notes ilike '%Smoke-test row for Tier 1 migration%';
```

Delete staged changes for the same smoke-test row:

```sql
delete from public.staged_changes
where target_table = 'library_context_bank'
  and (
    normalized_payload->>'notes' ilike '%Smoke-test row for Tier 1 migration%'
    or proposed_patch->>'notes' ilike '%Smoke-test row for Tier 1 migration%'
  );
```

Optionally delete related import log rows after inspecting them:

```sql
select id, dataset, filename, inserted_count, skipped_count, error_count, created_at
from public.import_logs
where dataset = 'tier1-smoke-test'
   or filename = 'manual-smoke'
order by created_at desc;
```

```sql
delete from public.import_logs
where dataset = 'tier1-smoke-test'
   or filename = 'manual-smoke';
```

If a content hash is known, cleanup can be narrowed further:

```sql
delete from public.library_context_bank
where content_hash = '<content_hash_from_dry_run_or_staged_change>';
```
