# Backend Status

## Current position

The application codebase is present in GitHub and can now be treated as the primary code source of truth.

However, **direct ownership/access to the linked Supabase project is currently unresolved**.

This means:
- the frontend code is under control in GitHub
- the connected runtime database is still a dependency risk until project access is confirmed

## Current app behaviour

### Anonymous users
- essay-plan persistence is **local-only** (browser storage)
- anonymous users do **not** persist plans to the backend

### Signed-in users
- signed-in saves persist to **Supabase**
- the app expects a valid Supabase connection via environment variables

## Required environment variables

The frontend expects:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

See `.env.example` for the expected local-development variables.

## Current risk

Until the correct Supabase project is identified and accessed, the following remain unresolved:

- who owns the linked database project
- whether SQL migrations are under your control
- whether backups / export are available
- whether future schema changes can be applied safely

## Current recommendation

Do **not** begin major backend/schema work until Supabase ownership/access is confirmed.

Instead:
1. keep GitHub as the code source of truth
2. preserve app logic and documentation in-repo
3. treat Google Sheets as staging/source material for future dataset migration
4. only begin Tier 1 Google Sheets → Supabase migration once the correct Supabase project is accessible

## Planned next backend phase

Once access is restored, the next controlled backend phase is:

### Tier 1 Google Sheets → Supabase migration

Planned runtime target tables:
- `library_quotes`
- `library_questions`
- `library_comparative_pairings`
- `library_thesis_bank`
- `library_paragraph_frames`
- `library_context_bank`

These tables already have a schema draft prepared outside the runtime database.

## Practical priority order

1. identify the correct Supabase project
2. confirm access and ownership
3. verify environment values
4. confirm whether migrations can be recreated/exported
5. only then begin Tier 1 dataset migration work
