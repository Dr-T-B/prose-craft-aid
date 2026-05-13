# Implementation Sequence

## Completed Safe Prep

1. Audited app structure, Supabase usage, environment assumptions, and write paths.
2. Updated `.env.example` to use staging-only placeholders.
3. Updated the browser Supabase client to prefer `VITE_SUPABASE_ANON_KEY`.
4. Added a development-time missing-env error message.
5. Added an app-level database type export at `src/types/database.types.ts`.
6. Documented the Supabase staging plan.

## Next Recommended Work

1. Confirm the Supabase CLI linked project is staging, or unlink/relink to staging.
2. Generate fresh database types from staging.
3. Run the full check suite locally and in CI.
4. Verify existing student and admin write paths using staging accounts.
5. Implement future academic modules only after verified source content and migrations are reviewed.
