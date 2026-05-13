# Codex Staging Audit

Date: 2026-05-13

## Scope

This audit prepares `Prose-craft-aid` for staging-safe development. No production Supabase project was connected to, migrated, seeded, reset, or mutated during this review.

## App Structure

- Stack verified: Vite, React, TypeScript, Tailwind, Supabase, and deployment config for Vercel/Netlify.
- Entry points: `src/main.tsx` mounts `src/App.tsx`; routing is handled by `react-router-dom`.
- Main route shell: `src/components/AppShell.tsx`, protected by `src/components/ProtectedRoute.tsx`.
- Core pages include dashboard, essay builder, paragraph builder/engine, timed practice/write, retrieval drill/toolkit, text architecture, comparison routes, interpretive flex, learning modules, library pages, auth/reset flows, and admin data manager.
- Content flow: `src/lib/ContentProvider.tsx` and `src/lib/contentRepo.ts` load remote Supabase content with local seed fallback from `src/data/seed.ts`.
- User-state flow: `src/lib/persistence.ts`, `src/lib/planRepository.ts`, and `src/hooks/useCurrentPlanCloud.ts` combine local storage with authenticated Supabase persistence.
- Supabase client setup: `src/integrations/supabase/client.ts` creates the browser client; `src/lib/supabaseClient.ts` re-exports it for older imports.
- Supabase types exist at `src/integrations/supabase/types.ts`; `src/types/database.types.ts` now re-exports them from the preferred app-level path.

## Database Assumptions

Frontend read paths reference these tables or views: `routes`, `questions`, `theses`, `paragraph_jobs`, `quote_methods`, `ao5_tensions`, `character_cards`, `theme_maps`, `symbol_entries`, `comparative_matrix`, `glossary_terms`, `paragraph_stems`, `modules`, `lessons`, `resources`, `past_paper_questions`, `thesis_routes`, `staged_changes`, `import_logs`, and `user_roles`.

Frontend write paths include:

- Student work: `essay_plans`, `saved_essay_plans`, `timed_sessions`, `reflection_entries`, `paragraph_attempts`, `student_quote_pair_mastery`, `retrieval_sessions`, `retrieval_items`, and `retrieval_responses`.
- Admin/staging workflow: `staged_changes`, `import_logs`, `saved_views`, and the `apply-staged-change` Edge Function.
- RPC/functions: `get_next_best_action`, `get_user_emails`, `has_role`, and `apply-staged-change`.

Visible RLS assumptions:

- Authenticated users own student-progress rows through `user_id` checks.
- Anonymous users should use local storage only for user work.
- Admin features assume role checks via `user_roles` and helper RPCs.
- The `apply-staged-change` Edge Function uses a service role key internally and must only be deployed/configured in staging until manually verified.

## Build Posture

- Package manager: npm, with `packageManager` set to `npm@11.6.2`.
- Node requirement: `>=22 <23`.
- Scripts available: `dev`, `build`, `build:dev`, `lint`, `preview`, `test`, `test:watch`, and `import-quotes`.
- No explicit `typecheck` script is present. TypeScript is configured with `noEmit` in `tsconfig.app.json`.
- Tests use Vitest and a shared setup file at `src/test/setup.ts`.
- Supabase migrations are present in `supabase/migrations/`.

## Environment Review

- Local `.env` and `.env.local` files exist and are ignored by `.gitignore`.
- Environment values were not printed or copied.
- `.env.example` exists and now documents staging-only placeholders for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The frontend Supabase client now reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with temporary compatibility for the older `VITE_SUPABASE_PUBLISHABLE_KEY` name.

## Risk Flags

- Local `.env` currently contains the older `VITE_SUPABASE_PUBLISHABLE_KEY` variable name. Move local staging setup to `VITE_SUPABASE_ANON_KEY`.
- `supabase/.temp/` indicates the CLI has been linked before. Treat the linked project as unknown until manually confirmed as staging.
- Several write paths are live in the app; all manual testing must use a duplicated/staging Supabase project.
- Admin import/review tools can stage or apply data changes. Do not deploy or invoke them against production until RLS, role checks, and target data are reviewed.
- Some database access uses `as any` or dynamic table names, so generated type coverage is incomplete.
- Schema drift risk exists because SQL files also live under `sql/` in addition to versioned migrations.

## Recommended Implementation Sequence

1. Confirm or create a duplicated Supabase project/branch for staging.
2. Generate fresh TypeScript database types from staging and update `src/integrations/supabase/types.ts`.
3. Configure local `.env` with staging-only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Configure Vercel preview/staging variables separately from production.
5. Run `npm run test`, `npm run lint`, and `npm run build`.
6. Test read paths, then authenticated student write paths, then admin staging workflows against staging only.
7. Add future product features through reviewed migrations and placeholder-free verified academic content.
