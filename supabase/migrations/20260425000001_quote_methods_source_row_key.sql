-- Add source_row_key to quote_methods for import deduplication.
-- Used by scripts/importQuotes.ts to match rows across re-runs.
alter table public.quote_methods
  add column if not exists source_row_key text;

create unique index if not exists quote_methods_source_row_key_uidx
  on public.quote_methods (source_row_key)
  where source_row_key is not null;
