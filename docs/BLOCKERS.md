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

## Partial library data — quote_pairs, character_cards, essay_plans empty

**Status:** Open. No import scripts exist. Manual authoring required.

`scripts/importQuotes.ts` only populates `quote_methods` (40 rows). No scripts exist
for the following tables, and no matching source files were found in
`~/Downloads/HT_AT_ChatGPT_App_Files/`:

- `quote_pairs` — comparative HT/AT quote pairings (0 rows locally and on production)
- `character_cards` — character-level content cards (0 rows)
- `essay_plans` — saved essay plan templates (0 rows)

**Action required:**
1. Write import scripts for each table (follow the pattern in `scripts/importQuotes.ts`)
2. Identify or author the source data (paired quotes, character cards, plan templates)
3. Run locally: `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/<script_name>`
4. Verify local counts > 0, then repeat against production with the production service role key

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
