# Deployment Checklist

Production project: `szdgsmpxtifrcmwelqfo` (eu-west-2).

## 1. Pre-deployment — database

### 1.1 Reconcile migration history
The April 29 migration (`20260429010000_fix_critical_rls_and_student_progress.sql`)
was applied to production but never recorded in `supabase_migrations.schema_migrations`.
Repair the history before pushing further migrations:

```bash
supabase migration repair --status applied 20260429010000 \
  --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
```

Also record the new stub migrations that exist locally but not yet on production:
```bash
# These tables already exist on production — record them as applied without re-running:
supabase migration repair --status applied 20260425000000 \
  --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
supabase migration repair --status applied 20260426000000 \
  --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
supabase migration repair --status applied 20260426000001 \
  --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
```

Then push the April 30 hardening migrations:
```bash
supabase db push \
  --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
```

Verify:
```bash
supabase migration list --db-url <production-db-url>
supabase db diff --db-url <production-db-url>
```

If the diff is non-empty, capture the output and create a forward
reconciliation migration (`20260429020000_reconcile_drift.sql`) — never edit
historical migration files.

### 1.2 Apply hardening migrations to production
Each is idempotent and safe to re-run.

```bash
supabase db push --db-url <production-db-url>
```

Or via `psql` per file:
- `supabase/migrations/20260430000000_security_hardening.sql`
- `supabase/migrations/20260430010000_performance_indexes.sql`
- `supabase/migrations/20260430020000_normalise_policies.sql`

### 1.3 Manual auth toggles (Supabase Dashboard)
- **Settings → Auth → Password → Enable HaveIBeenPwned check.** Cannot be done
  via migration. Required to satisfy the leaked-password protection advisory.
- **Settings → Auth → Multi-factor authentication.** Confirm desired state for
  the pilot.

### 1.4 Project hygiene
- Pause or delete the unused project `neha_a_level_eng_lit_p2`
  (`zzskunfggzskxkrcohom`) to remove ambient billing and reduce surface area.

## 2. Pre-deployment — app

### 2.1 Resolve dual lockfile
This worktree has both `package-lock.json` and `bun.lockb` / `bun.lock` checked
in, while `package.json` declares `"packageManager": "npm@11.6.2"` and both
`vercel.json` / `netlify.toml` use `npm run build`. Decision needed before the
next deploy:

- **Keep npm (current deploy assumption):** delete `bun.lockb` and `bun.lock`,
  remove any Bun-specific scripts, and document npm as canonical.
- **Switch to Bun:** delete `package-lock.json`, update both deploy configs to
  use `bun install && bun run build`, and update `engines` in `package.json`.

This is left intentionally untouched until the deploy platform decision is
confirmed — making the wrong choice here breaks CI silently.

### 2.2 Confirm single deployment platform
Both `vercel.json` and `netlify.toml` are present. Only one platform should
own the production deploy. Identify the connected dashboard and remove the
other config file.

### 2.3 Routing sanity
- `/build` now redirects to `/builder` (was previously a redirect to `/`).
- `/dashboard` redirects to `/`.
Re-test bookmarks after deploy.

## 3. Post-pilot cleanup (defer until real query data)

- **Audit unused indexes.** Review_1 flagged 35+ indexes that may be unused.
  These cannot be safely dropped without query plan data from real student
  traffic. After ~2 weeks of pilot use, run:
  ```sql
  SELECT relname, indexrelname, idx_scan, idx_tup_read
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public' AND idx_scan = 0
  ORDER BY pg_relation_size(indexrelid) DESC;
  ```
- **`timed_sessions` and `reflection_entries`** — review whether the features
  are actually wired up end-to-end or whether the tables can be deferred.

## 4. Final verification (after deploy)

- `supabase migration list` is clean (local and production agree).
- Sign in with a test student account and confirm `get_next_best_action`
  returns a valid recommendation.
- Submit a paragraph attempt and confirm a row lands in `paragraph_attempts`.
- Attempt a write to `timed_sessions` as an anon user — expect 403/RLS error.
