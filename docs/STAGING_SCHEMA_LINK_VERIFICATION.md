# Staging Schema Link Verification

Date: 2026-05-14

## Scope

This verification linked the local Supabase CLI metadata to the staging Supabase project only.

- Staging project ref: `nxlxunygoccbnzdopqna`
- Production deny-list ref: `szdgsmpxtifrcmwelqfo`

The staging ref is different from the production ref.

## Safety guardrails followed

- Production Supabase was not connected to, migrated, seeded, reset, invoked, or mutated.
- No Supabase secrets were printed or inspected.
- `supabase db push` was not run.
- `supabase db reset` was not run.
- `supabase migration repair` was not run.
- No Edge Function deployment command was run.
- Database types were not regenerated.

## Linkage result

`npx supabase link --project-ref nxlxunygoccbnzdopqna` completed successfully.

After linking:

- `supabase/config.toml` points to `nxlxunygoccbnzdopqna`.
- Safe CLI metadata in `supabase/.temp/project-ref` points to `nxlxunygoccbnzdopqna`.
- A literal production-ref check against `supabase/config.toml` and `supabase/.temp` found no `szdgsmpxtifrcmwelqfo` references.

## Read-only staging checks

`npx supabase migration list --linked` connected to the linked staging database and reported all local migrations as absent remotely. The remote migration column was empty for the local migration set.

`npx supabase inspect db table-stats --linked` connected to the linked staging database and returned no public tables.

`npx supabase db dump --linked --schema public --file /tmp/prose-craft-aid-staging-schema.sql` was attempted as a read-only schema-only check, but it could not run because Docker was not available locally. No schema dump was produced.

## Decision

Staging appears empty or incomplete for this app: the expected public app tables are not present, and the migration history is not applied remotely.

Type generation is blocked. Do not overwrite `src/integrations/supabase/types.ts` until the staging schema contains the expected app tables.

## Required next manual action

Prepare the staging database with the intended app schema using an approved staging-only process. After staging contains the expected tables, rerun linkage and schema verification before generating Supabase TypeScript types.
