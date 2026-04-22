/**
 * Import JSON quote files from src/data/quotes/ into Supabase.
 *
 * Usage:
 *   npm run import-quotes
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in your .env file alongside the
 * existing VITE_SUPABASE_URL entry.
 *
 * Re-running is safe: rows are upserted on (source_text, md5(quote_text)).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Env / client setup
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env vars. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Types mirroring the JSON file schemas
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

interface MergedQuote extends MainQuoteFile, MetadataFile {}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUOTES_DIR = path.resolve(__dirname, '../src/data/quotes');

/** True when filename has a suffix keyword after the number prefix, e.g. HT01_NOW.json */
function isMetadataFile(filename: string): boolean {
  return /^(HT|AT)\d+_.+\.json$/i.test(filename);
}

/** Extract the numeric prefix from a filename, e.g. HT01_NOW.json → 1, AT20.json → 20 */
function numericPrefix(filename: string): number {
  const m = filename.match(/^(?:HT|AT)(\d+)/i);
  return m ? parseInt(m[1], 10) : -1;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function loadDir(dir: string): { main: MergedQuote[]; count: { main: number; meta: number } } {
  if (!fs.existsSync(dir)) return { main: [], count: { main: 0, meta: 0 } };

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const mainFiles = files.filter((f) => !isMetadataFile(f));
  const metaFiles = files.filter((f) => isMetadataFile(f));

  // Build a lookup: numeric prefix → metadata
  const metaByRank = new Map<number, MetadataFile>();
  for (const f of metaFiles) {
    const rank = numericPrefix(f);
    if (rank >= 0) {
      metaByRank.set(rank, readJson<MetadataFile>(path.join(dir, f)));
    }
  }

  const merged: MergedQuote[] = mainFiles.map((f) => {
    const main = readJson<MainQuoteFile>(path.join(dir, f));
    const rank = main.b_mode_rank ?? numericPrefix(f);
    const meta = rank >= 0 ? metaByRank.get(rank) ?? {} : {};
    return { ...main, ...meta };
  });

  return { main: merged, count: { main: mainFiles.length, meta: metaFiles.length } };
}

// ---------------------------------------------------------------------------
// Field mapping
// ---------------------------------------------------------------------------

/** Map grade_priority string to the app's level_tag values */
function gradePriorityToLevelTag(gp?: string): string {
  switch (gp?.toLowerCase()) {
    case 'higher': return 'top_band';
    case 'foundation': return 'secure';
    default: return 'strong'; // "all" or missing → strong (mid-tier default)
  }
}

function mapToDbRow(q: MergedQuote) {
  return {
    // Core existing fields
    source_text: q.text_name,
    quote_text: q.quote_text,
    method: q.linked_methods?.[0] ?? '',
    best_themes: q.linked_themes ?? [],
    // effect_prompt and meaning_prompt are required by the DB but not present in
    // the JSON files — populate with placeholder text so the import doesn't fail.
    // Update these in Supabase Studio or add them to the JSON files later.
    effect_prompt: '',
    meaning_prompt: '',
    level_tag: gradePriorityToLevelTag(q.grade_priority),

    // New enriched fields
    speaker_or_narrator: q.speaker_or_narrator ?? null,
    location_reference: q.location_reference ?? null,
    plain_english_meaning: q.plain_english_meaning ?? null,
    linked_motifs: q.linked_motifs ?? null,
    linked_context: q.linked_context ?? null,
    linked_interpretations: q.linked_interpretations ?? null,
    opening_stems: q.opening_stems ?? null,
    comparative_prompts: q.comparative_prompts ?? null,
    grade_priority: q.grade_priority ?? null,
    is_core_quote: q.is_core_quote ?? false,
    b_mode_rank: q.b_mode_rank ?? null,
    exam_question_tags: q.exam_question_tags ?? null,
    recommended_for_questions: q.recommended_for_questions ?? null,
    question_types: q.question_types ?? null,
    ao_priority: q.ao_priority ?? null,
    comparison_strength: q.comparison_strength ?? null,
    retrieval_priority: q.retrieval_priority ?? null,
    best_used_for: q.best_used_for ?? null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const htDir = path.join(QUOTES_DIR, 'ht');
  const atDir = path.join(QUOTES_DIR, 'at');

  const ht = loadDir(htDir);
  const at = loadDir(atDir);

  const allQuotes = [...ht.main, ...at.main];

  if (allQuotes.length === 0) {
    console.log('No JSON files found in src/data/quotes/ht/ or src/data/quotes/at/.');
    console.log('Drop your exported JSON files into those folders and re-run.');
    process.exit(0);
  }

  console.log(`Loaded ${ht.count.main} HT main + ${ht.count.meta} HT metadata files`);
  console.log(`Loaded ${at.count.main} AT main files`);
  console.log(`Upserting ${allQuotes.length} quotes…`);

  const rows = allQuotes.map(mapToDbRow);

  // Upsert in batches of 50 to stay well within Supabase's request limits
  const BATCH = 50;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('quote_methods')
      .upsert(batch, {
        onConflict: 'source_text,quote_text_md5',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      // Fallback: try insert-or-update one-by-one to surface the problem row
      for (const row of batch) {
        const { error: rowErr } = await supabase
          .from('quote_methods')
          .upsert(row, { ignoreDuplicates: false });
        if (rowErr) {
          console.error(`  Error on quote "${row.quote_text.slice(0, 60)}…":`, rowErr.message);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += data?.length ?? batch.length;
    }
  }

  console.log('');
  console.log('--- Import summary ---');
  console.log(`  HT quotes: ${ht.count.main}`);
  console.log(`  AT quotes: ${at.count.main}`);
  console.log(`  Total processed: ${allQuotes.length}`);
  console.log(`  Upserted: ${inserted}`);
  if (errors > 0) console.warn(`  Errors: ${errors} (see above)`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
