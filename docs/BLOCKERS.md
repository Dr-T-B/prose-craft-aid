# Blockers

Tracked deferred items requiring manual action.

---

## Missing stub migrations for production-only tables

**Status:** Resolved locally. Production action required.

The following tables existed in production without migration files. Stub
migrations were created during this session:

- `20260425000000_create_quote_pairs.sql` — `quote_pairs` table
- `20260425000001_quote_methods_source_row_key.sql` — `source_row_key` column on `quote_methods`
- `20260426000000_create_missing_content_tables.sql` — `exam_questions`, `thesis_routes`, `paragraph_templates`
- `20260426000001_create_glossary_terms.sql` — `glossary_terms`

**Production action:** Before running `supabase db push`, record these as
already-applied on production (the tables exist, they just need history entries):
```bash
for v in 20260425000000 20260425000001 20260426000000 20260426000001; do
  supabase migration repair --status applied $v \
    --db-url postgresql://postgres:<password>@db.szdgsmpxtifrcmwelqfo.supabase.co:5432/postgres
done
```

---

## Partial library data — quote_pairs, character_cards, essay_plans empty

**Status:** Open. Manual action required.

`scripts/importQuotes.ts` only populates `quote_methods` (40 rows inserted).
The following tables remain empty locally and need separate import processes:

- `quote_pairs` — comparative quote pairings
- `character_cards` — character-level content
- `essay_plans` — saved essay plan templates

**Action required:** Identify and run the source import scripts or seed data
for these tables. Source files may be in
`~/Downloads/HT_AT_ChatGPT_App_Files/` or a separate location.

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
