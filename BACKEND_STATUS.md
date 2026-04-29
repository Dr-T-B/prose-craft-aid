# Backend Status

## Current position

Supabase project `szdgsmpxtifrcmwelqfo` (eu-west-2) is the canonical runtime
database. Access is confirmed and the app can be treated as production-shaped:
schema is under migration control in `supabase/migrations/`, and the live DB
matches the migrations after the April 29 + April 30 hardening passes.

## Live state

- `has_role` is granted to `anon` and `authenticated` so policies that call it
  no longer fail at query time.
- `get_next_best_action(uuid)` exists on production with the auth.uid() guard.
- Retrieval policies (`retrieval_items`, `retrieval_sessions`,
  `retrieval_responses`) are authenticated-only — no anon writes.
- Student-progress tables (`paragraph_attempts`, `student_quote_pair_mastery`,
  `paragraph_attempt_quote_links`) use canonical "Students can …" policy
  names with `(select auth.uid())` for cached planning.
- `timed_sessions`, `saved_essay_plans`, `reflection_entries` are
  authenticated-only after `20260430000000_security_hardening.sql` is applied.

## Content seeded

- `quote_methods`: ~2389
- `routes`: 8
- `questions`: 40
- Plus library tables (`library_quotes`, `library_questions`,
  `library_comparative_pairings`, `library_thesis_bank`,
  `library_paragraph_frames`, `library_context_bank`) populated via
  `scripts/importQuotes.ts`.

## Required environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

See `.env.example`. Local development uses `http://127.0.0.1:54321` once
`supabase start` brings the local stack up.

## Current app behaviour

### Anonymous users
- Essay-plan persistence is local-only (browser storage).
- Anon writes to `timed_sessions`, `saved_essay_plans`, `reflection_entries`,
  and the retrieval tables are blocked by RLS.

### Signed-in users
- Saves persist to Supabase via the canonical RLS policies above.

## Outstanding manual steps

Tracked in [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md). The
short version:
1. Apply the three `20260430*` migrations to production.
2. Record `20260429010000` as applied on production via
   `supabase migration repair`.
3. Enable HaveIBeenPwned password protection in the Supabase Auth dashboard.
4. Resolve the dual-lockfile situation (npm vs Bun) before the next deploy.

## Migration history

Migrations are timestamped UTC and applied in lexicographic order. New work
must always be a forward migration — never edit historical files.

| Migration | Purpose |
|---|---|
| `20260417115303_…` | Initial schema (saved_essay_plans, timed_sessions, …) |
| `20260418143855_…` | User roles, saved views |
| `20260418230444_…` | Profiles, modules, lessons, progress |
| `20260419*` | Normalization proposals, staged changes |
| `20260422120000_extend_quote_methods.sql` | Quote-method fields |
| `20260423_add_essay_plans.sql` | Essay plans table |
| `20260424150000_add_tier1_library_tables.sql` | Library tables |
| `20260427110000_paragraph_attempts_…` | Paragraph attempts + mastery |
| `20260427113000_dashboard_next_best_action.sql` | Recommendation RPC |
| `20260428020000_add_retrieval_tables.sql` | Retrieval tables |
| `20260429010000_fix_critical_rls_…` | RLS repair, FKs, idempotent drops |
| `20260430000000_security_hardening.sql` | Anon-write closure, function locks |
| `20260430010000_performance_indexes.sql` | FK indexes, cached auth.uid() |
| `20260430020000_normalise_policies.sql` | Drop legacy policy names |
