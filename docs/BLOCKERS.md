# Blockers

Tracked deferred items requiring manual action.

---

## Missing stub migrations for production-only tables

**Status:** Resolved. Production migration history repaired and hardening migrations pushed.

All 5 stub migrations recorded on production as applied. The 3 hardening migrations
(`20260430000000`, `20260430010000`, `20260430020000`) were pushed to production
successfully on 2026-04-29.

Also resolved: `20260424_essay_plans_add_is_current.sql` had a non-standard version
format (date only, no time) that caused Supabase CLI sort-order mismatch. Renamed to
`20260424999999_essay_plans_add_is_current.sql` and production history repaired to match.

---

## Partial library data — quote_pairs, character_cards empty locally

**Status:** Open for local dev only. Production is populated. No action required for pilot.

Production has 26 `quote_pairs` rows and 21 `character_cards` rows from a prior direct
import. Local is empty after `supabase db reset`. To populate local for development,
re-run the same import that was used for production (source not yet in the repo).

`essay_plans` is user-generated data (each row is a student's saved plan, written by
the app on save). Being empty before students use the app is correct — no import needed.

---

## Dual lockfile

**Status:** Resolved. See commit history.

`package-lock.json` retained (npm is canonical per deploy configs).
`bun.lockb` and `bun.lock` removed.

---

## Docker MCP Toolkit not connected

**Status:** Worked around with docker CLI.

Docker MCP Toolkit was not in the connected MCP server list during this
session. Container diagnostics were performed via `docker` CLI instead.
To connect: Docker Desktop → MCP Toolkit → Clients → Claude Code →
Connect to (Global) → restart Claude Code.
