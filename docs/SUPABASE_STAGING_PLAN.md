# Supabase Staging Plan

## Safety Rule

Do not connect this implementation work to production Supabase. All schema changes must be reviewed as migrations and applied first to a duplicated Supabase project or Supabase branch.

## Required Staging Project Settings

Manually verify these settings before local or preview testing:

- Project URL: use only the staging project URL in `VITE_SUPABASE_URL`.
- Anon key: use only the staging anon key in `VITE_SUPABASE_ANON_KEY`.
- Auth providers and email settings match the app's auth flows.
- Redirect URLs include local development and Vercel preview/staging URLs, not only production.
- Storage buckets exist where required, with staging-safe policies.
- RLS policies match production intent but are verified against staging test accounts.
- Edge Functions are deployed only to staging until reviewed, especially `apply-staged-change`.
- Function secrets are staged separately and never copied into frontend env files.
- Webhooks, scheduled jobs, and outbound integrations are disabled or pointed at staging endpoints.
- Database extensions match production where required.
- Realtime publication settings are checked for tables used by admin review dashboards.

## Environment Variables

Local staging development should use:

```env
VITE_SUPABASE_URL=STAGING_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=STAGING_SUPABASE_ANON_KEY_HERE
```

Do not commit real values. Do not use production values in `.env`, Vercel preview variables, Netlify variables, or Supabase CLI linked project metadata.

## Migration Strategy

- Place schema changes in versioned files under `supabase/migrations/`.
- Prefer one focused migration per product/database concern.
- Include comments for irreversible or security-sensitive changes.
- Add rollback notes where practical in migration comments or matching docs.
- Review RLS and grants in the same PR as schema changes that introduce new tables or write paths.
- Apply migrations first to staging and verify through the app before production is considered.
- Do not run ad hoc SQL against production from local development.

## Database Types

- Generate Supabase TypeScript types from the staging project.
- Keep generated types in `src/integrations/supabase/types.ts`.
- Import app-facing database types through `src/types/database.types.ts`.
- Do not invent table fields when the staging schema is unknown.

## Verification Checklist

- Frontend connects to staging only.
- App loads when production keys are absent.
- Missing local env variables produce a clear development error.
- All read paths work with staging data or documented local fallback.
- Student write paths are tested with staging users only.
- Admin review/apply flows are tested only against staging tables.
- RLS behavior is verified for anonymous, student, and admin accounts.
- Edge Function secrets exist only in the staging Supabase project during testing.
- Vercel preview/staging environment variables are separate from production variables.
- Generated database types match the staging schema after migrations are applied.
