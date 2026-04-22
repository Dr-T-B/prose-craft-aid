/**
 * Import JSON quote files into Supabase quote_methods table.
 *
 * Source folders (actual locations on disk):
 *   ~/Downloads/HT_AT_ChatGPT_App_Files/HT/          — HT main + metadata files
 *   ~/Downloads/HT_AT_ChatGPT_App_Files/AT/          — AT main files
 *   ~/Downloads/HT_AT_ChatGPT_App_Files/AT_EXAM_QUESTION_STEMS/  — AT metadata files
 *
 * Usage:
 *   npm run import-quotes
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Re-running is safe: existing rows (matched by source_text + quote_text) are
 * updated in-place; new rows are inserted. Counts of each are printed at the end.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ---------------------------------------------------------------------------
// Env / Supabase client
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\nMissing environment variables. Add to your .env file:\n');
  if (!supabaseUrl)       console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  if (!serviceRoleKey)    console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  console.error('\nFind your service role key: Supabase Studio → Project Settings → API → service_role key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const BASE_DIR = path.join(os.homedir(), 'Downloads', 'HT_AT_ChatGPT_App_Files');
const HT_DIR  = path.join(BASE_DIR, 'HT');
const AT_DIR  = path.join(BASE_DIR, 'AT');
const AT_META_DIR = path.join(BASE_DIR, 'AT_EXAM_QUESTION_STEMS');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MainQuoteFile {
  text_name: string;
  quote_text: string;
  speaker_or_narrator?: string;
  location_reference?: string;
  plain_english_meaning?: string;
  linked_themes?: string[];
  linked_motifs?: string[];
  linked_methods?: string[];
  linked_context?: string[];
  linked_interpretations?: string[];
  opening_stems?: string[];
  comparative_prompts?: string[];
  grade_priority?: string;
  is_core_quote?: boolean;
  b_mode_rank?: number;
}

interface MetadataFile {
  exam_question_tags?: string[];
  recommended_for_questions?: string[];
  question_types?: string[];
  ao_priority?: string[];
  comparison_strength?: string;
  retrieval_priority?: number;
  best_used_for?: string[];
}

type MergedQuote = MainQuoteFile & MetadataFile;

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

/** True if filename has a non-digit word after the number, e.g. HT01_NOW.json */
function isMetadataFilename(filename: string): boolean {
  return /^(HT|AT)\d+_[A-Z_]+\.json$/i.test(filename);
}

/** Extract the numeric rank from a filename: HT03_A_MAN.json → 3, AT07.json → 7 */
function fileRank(filename: string): number {
  const m = filename.match(/^(?:HT|AT)(\d+)/i);
  return m ? parseInt(m[1], 10) : -1;
}

/**
 * Load one directory of quotes, merging metadata from a separate metadata dir if provided.
 * Returns merged quote objects and counts.
 */
function loadQuotes(
  mainDir: string,
  metaDir?: string,
): { quotes: MergedQuote[]; mainCount: number; metaCount: number } {
  if (!fs.existsSync(mainDir)) {
    console.warn(`  Directory not found: ${mainDir}`);
    return { quotes: [], mainCount: 0, metaCount: 0 };
  }

  const allFiles = fs.readdirSync(mainDir).filter((f) => f.endsWith('.json'));
  const mainFiles = allFiles.filter((f) => !isMetadataFilename(f));

  // HT metadata lives alongside main files in the same dir; AT metadata is in a separate dir
  const htMetaFiles = allFiles.filter((f) => isMetadataFilename(f));

  // Build rank → metadata maps
  const htMetaMap = new Map<number, MetadataFile>();
  for (const f of htMetaFiles) {
    const rank = fileRank(f);
    if (rank >= 0) htMetaMap.set(rank, readJson<MetadataFile>(path.join(mainDir, f)));
  }

  const atMetaMap = new Map<number, MetadataFile>();
  if (metaDir && fs.existsSync(metaDir)) {
    for (const f of fs.readdirSync(metaDir).filter((f) => f.endsWith('.json'))) {
      const rank = fileRank(f);
      if (rank >= 0) atMetaMap.set(rank, readJson<MetadataFile>(path.join(metaDir, f)));
    }
  }

  const metaMap = atMetaMap.size > 0 ? atMetaMap : htMetaMap;
  const metaCount = metaMap.size;

  const quotes: MergedQuote[] = mainFiles.map((f) => {
    const main = readJson<MainQuoteFile>(path.join(mainDir, f));
    const rank = main.b_mode_rank ?? fileRank(f);
    const meta: MetadataFile = (rank >= 0 ? metaMap.get(rank) : undefined) ?? {};
    return { ...main, ...meta };
  });

  return { quotes, mainCount: mainFiles.length, metaCount };
}

// ---------------------------------------------------------------------------
// Field mapping
// ---------------------------------------------------------------------------

/**
 * Map grade_priority to the app's level_tag.
 * Actual values seen in files: "B", "all", "higher", "foundation"
 * "B" (and anything else) → "strong" (safe mid-tier default)
 */
function toLevel(gp?: string): string {
  switch (gp?.toLowerCase()) {
    case 'higher':     return 'top_band';
    case 'foundation': return 'secure';
    case 'a':          return 'top_band';
    case 'c':          return 'secure';
    default:           return 'strong';  // "B", "all", missing
  }
}

function toRowKey(q: MergedQuote): string {
  const prefix = q.text_name?.toLowerCase().includes('atonement') ? 'at' : 'ht';
  const rank = String(q.b_mode_rank ?? 0).padStart(2, '0');
  return `qm_${prefix}_${rank}`;
}

function toDbRow(q: MergedQuote) {
  const rowKey = toRowKey(q);
  return {
    id:                        rowKey,
    source_row_key:            rowKey,
    source_text:               q.text_name,
    quote_text:                q.quote_text,
    method:                    q.linked_methods?.[0] ?? '',
    best_themes:               q.linked_themes ?? [],
    effect_prompt:             '',   // not in source JSON; fill via Studio later
    meaning_prompt:            '',
    level_tag:                 toLevel(q.grade_priority),
    // enriched fields
    speaker_or_narrator:       q.speaker_or_narrator       ?? null,
    location_reference:        q.location_reference        ?? null,
    plain_english_meaning:     q.plain_english_meaning     ?? null,
    linked_motifs:             q.linked_motifs             ?? null,
    linked_context:            q.linked_context            ?? null,
    linked_interpretations:    q.linked_interpretations    ?? null,
    opening_stems:             q.opening_stems             ?? null,
    comparative_prompts:       q.comparative_prompts       ?? null,
    grade_priority:            q.grade_priority            ?? null,
    is_core_quote:             q.is_core_quote             ?? false,
    b_mode_rank:               q.b_mode_rank               ?? null,
    exam_question_tags:        q.exam_question_tags        ?? null,
    recommended_for_questions: q.recommended_for_questions ?? null,
    question_types:            q.question_types            ?? null,
    ao_priority:               q.ao_priority               ?? null,
    comparison_strength:       q.comparison_strength       ?? null,
    retrieval_priority:        q.retrieval_priority        ?? null,
    best_used_for:             q.best_used_for             ?? null,
  };
}

// ---------------------------------------------------------------------------
// Upsert: fetch existing rows first, then split into inserts vs updates
// ---------------------------------------------------------------------------

async function upsertQuotes(rows: ReturnType<typeof toDbRow>[]): Promise<{ inserted: number; updated: number; errors: number }> {
  // Fetch all existing (id, source_text, quote_text) to determine insert vs update
  const { data: existing, error: fetchErr } = await supabase
    .from('quote_methods')
    .select('id, source_text, quote_text');

  if (fetchErr) {
    console.error('Failed to fetch existing rows:', fetchErr.message);
    console.error('Check that SUPABASE_SERVICE_ROLE_KEY is correct and has sufficient privileges.');
    process.exit(1);
  }

  // Key: "${source_text}||${quote_text}" → existing row id
  const existingMap = new Map<string, string>();
  for (const row of existing ?? []) {
    existingMap.set(`${row.source_text}||${row.quote_text}`, row.id);
  }

  const toInsert: typeof rows = [];
  const toUpdate: Array<{ id: string; row: typeof rows[0] }> = [];

  for (const row of rows) {
    const key = `${row.source_text}||${row.quote_text}`;
    const existingId = existingMap.get(key);
    if (existingId) {
      toUpdate.push({ id: existingId, row });
    } else {
      toInsert.push(row);
    }
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Batch INSERT new rows (50 at a time)
  const BATCH = 50;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('quote_methods').insert(batch);
    if (error) {
      console.error(`  Insert batch error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  // UPDATE existing rows one-by-one (40 quotes total, so no need for batching)
  for (const { id, row } of toUpdate) {
    const { error } = await supabase
      .from('quote_methods')
      .update(row)
      .eq('id', id);
    if (error) {
      console.error(`  Update error for "${row.quote_text.slice(0, 50)}": ${error.message}`);
      errors++;
    } else {
      updated++;
    }
  }

  return { inserted, updated, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Loading quote files…\n');

  const ht = loadQuotes(HT_DIR);
  const at = loadQuotes(AT_DIR, AT_META_DIR);

  console.log(`HT: ${ht.mainCount} main quotes, ${ht.metaCount} metadata files`);
  console.log(`AT: ${at.mainCount} main quotes, ${at.metaCount} metadata files`);

  const allQuotes = [...ht.quotes, ...at.quotes];
  if (allQuotes.length === 0) {
    console.error('\nNo quotes loaded. Check that the source folders exist:');
    console.error(`  ${HT_DIR}`);
    console.error(`  ${AT_DIR}`);
    process.exit(1);
  }

  console.log(`\nUpserting ${allQuotes.length} quotes into Supabase…\n`);

  const rows = allQuotes.map(toDbRow);
  const { inserted, updated, errors } = await upsertQuotes(rows);

  console.log('─'.repeat(40));
  console.log('Import complete');
  console.log(`  HT quotes:    ${ht.mainCount}`);
  console.log(`  AT quotes:    ${at.mainCount}`);
  console.log(`  Total:        ${allQuotes.length}`);
  console.log(`  Inserted:     ${inserted}  (new rows)`);
  console.log(`  Updated:      ${updated}   (existing rows)`);
  if (errors > 0) console.warn(`  Errors:       ${errors} (see above)`);
  console.log('─'.repeat(40));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
