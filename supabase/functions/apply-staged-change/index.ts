// Apply an approved staged change to the live record.
//
// Generic for any proposal_type. Validates:
//   - caller is admin (JWT + has_role)
//   - staged change is in 'pending' status
//   - target_table is in the whitelist
//   - every key in proposed_patch is in changed_fields AND in the per-table
//     whitelist of writable fields
//   - the live row's snapshot of those fields still matches original_snapshot
//     (optimistic concurrency — fail if the row drifted since proposal time)
//
// On success: applies the patch, marks staged change 'applied'.
// On any failure after status check: marks 'failed' with apply_error.

import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const set = (fields: string[]) => new Set(fields);

const ARRAY_FIELDS = new Set([
  "theme_tags",
  "method_tags",
  "context_tags",
  "motif_tags",
  "ao_tags",
  "method_links",
  "context_links",
  "linked_quote_refs",
]);

const NUMBER_FIELDS = new Set(["mark_value", "source_row_number"]);
const RESERVED_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
]);

const LIBRARY_TABLES = new Set([
  "library_quotes",
  "library_questions",
  "library_comparative_pairings",
  "library_thesis_bank",
  "library_paragraph_frames",
  "library_context_bank",
]);

// Whitelist: which fields each table allows the apply step to write.
// Keep tight — anything not listed here will be rejected even if a proposal
// somehow contains it. Extend as new edit surfaces are added.
const FIELD_WHITELIST: Record<string, Set<string>> = {
  routes: set([
    "name",
    "core_question",
    "hard_times_emphasis",
    "atonement_emphasis",
    "comparative_insight",
    "best_use",
    "level_tag",
  ]),
  questions: set([
    "family",
    "level_tag",
    "primary_route_id",
    "secondary_route_id",
    "likely_core_methods",
  ]),
  quote_methods: set(["source_text", "level_tag", "method", "best_themes"]),
  theme_maps: set(["family"]),
  ao5_tensions: set(["level_tag"]),
  theses: set(["theme_family", "level", "route_id"]),
  paragraph_jobs: set(["question_family", "route_id"]),
  character_cards: set(["source_text", "themes"]),
  symbol_entries: set(["source_text", "themes"]),
  comparative_matrix: set(["axis", "themes"]),
  library_quotes: set([
    "quote_text",
    "source_text",
    "author",
    "character_name",
    "speaker",
    "chapter",
    "part",
    "location_ref",
    "theme_tags",
    "motif_tags",
    "method_tags",
    "context_tags",
    "ao_tags",
    "difficulty_level",
    "exam_relevance",
    "analysis",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
  library_questions: set([
    "question_text",
    "component",
    "paper",
    "section",
    "source_text",
    "paired_text",
    "theme_tags",
    "method_tags",
    "context_tags",
    "ao_tags",
    "mark_value",
    "difficulty_level",
    "exam_series",
    "question_type",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
  library_comparative_pairings: set([
    "pairing_title",
    "source_text",
    "text_a",
    "text_b",
    "quote_a",
    "quote_b",
    "comparison_focus",
    "theme_tags",
    "method_links",
    "context_links",
    "ao_tags",
    "argument_summary",
    "exam_use",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
  library_thesis_bank: set([
    "thesis_text",
    "question_focus",
    "source_text",
    "paired_text",
    "theme_tags",
    "ao_tags",
    "grade_band",
    "argument_type",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
  library_paragraph_frames: set([
    "frame_title",
    "source_text",
    "frame_text",
    "opening_stem",
    "comparison_stem",
    "ao2_stem",
    "ao3_stem",
    "ao4_stem",
    "ao5_stem",
    "theme_tags",
    "ao_tags",
    "grade_band",
    "use_case",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
  library_context_bank: set([
    "context_title",
    "context_point",
    "source_text",
    "context_type",
    "theme_tags",
    "ao_tags",
    "linked_quote_refs",
    "exam_use",
    "notes",
    "metadata",
    "content_hash",
    "source_dataset",
    "source_sheet",
    "source_row_number",
    "import_log_id",
  ]),
};

interface ApplyBody {
  staged_change_id: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => valuesEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

function validatePatchValue(field: string, value: unknown): string | null {
  if (ARRAY_FIELDS.has(field) && !Array.isArray(value)) {
    return `Invalid field type for "${field}": expected array`;
  }
  if (
    field === "metadata" &&
    (!value || typeof value !== "object" || Array.isArray(value))
  ) {
    return 'Invalid field type for "metadata": expected object';
  }
  if (
    NUMBER_FIELDS.has(field) &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    return `Invalid field type for "${field}": expected number`;
  }
  return null;
}

function getPatch(staged: Record<string, unknown>): Record<string, unknown> {
  const normalizedPayload = staged.normalized_payload;
  if (
    normalizedPayload &&
    typeof normalizedPayload === "object" &&
    !Array.isArray(normalizedPayload)
  ) {
    return normalizedPayload as Record<string, unknown>;
  }
  return staged.proposed_patch as Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Auth ----------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return json({ error: "Forbidden — admin only" }, 403);
  }

  // --- Parse + load -------------------------------------------------------
  let body: ApplyBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body?.staged_change_id || typeof body.staged_change_id !== "string") {
    return json({ error: "staged_change_id is required" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: staged, error: sErr } = await admin
    .from("staged_changes")
    .select("*")
    .eq("id", body.staged_change_id)
    .maybeSingle();
  if (sErr || !staged) return json({ error: "Staged change not found" }, 404);
  if (staged.status !== "pending") {
    return json({ error: `Staged change is already ${staged.status}` }, 409);
  }

  const markFailed = async (msg: string) => {
    await admin
      .from("staged_changes")
      .update({
        status: "failed",
        apply_error: msg,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", staged.id);
  };

  const markApplied = async () =>
    await admin
      .from("staged_changes")
      .update({
        status: "applied",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        apply_error: null,
      })
      .eq("id", staged.id);

  // --- Whitelist checks ---------------------------------------------------
  const allowedFields = FIELD_WHITELIST[staged.target_table];
  if (!allowedFields) {
    return json({ error: `Invalid target table: ${staged.target_table}` }, 400);
  }

  const patch = getPatch(staged);
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return json({
      error: "normalized_payload/proposed_patch must be a JSON object",
    }, 400);
  }
  const patchKeys = Object.keys(patch);
  if (patchKeys.length === 0) {
    return json({ error: "normalized_payload/proposed_patch is empty" }, 400);
  }

  const declaredFields = new Set<string>(staged.changed_fields ?? []);
  for (const k of patchKeys) {
    if (RESERVED_FIELDS.has(k)) {
      return json(
        { error: `Invalid field name: "${k}" is system-managed` },
        400,
      );
    }
    if (!declaredFields.has(k)) {
      return json({
        error: `Patch field "${k}" not declared in changed_fields`,
      }, 400);
    }
    if (!allowedFields.has(k)) {
      return json({
        error:
          `Invalid field name: "${k}" is not writable for table ${staged.target_table}`,
      }, 400);
    }
    const typeError = validatePatchValue(k, patch[k]);
    if (typeError) {
      return json({ error: typeError }, 400);
    }
  }

  const isLibraryTable = LIBRARY_TABLES.has(staged.target_table);
  const operation = typeof staged.operation === "string"
    ? staged.operation.toLowerCase()
    : "update";
  const shouldUpsertByContentHash = isLibraryTable &&
    (operation === "insert" || operation === "upsert");

  if (isLibraryTable && operation === "delete") {
    const msg = "Delete is not supported for library_* staged changes.";
    await markFailed(msg);
    return json({ error: msg }, 400);
  }

  if (
    isLibraryTable &&
    !["insert", "upsert", "update"].includes(operation)
  ) {
    const msg =
      `Unsupported operation for library_* staged changes: ${operation}`;
    await markFailed(msg);
    return json({ error: msg }, 400);
  }

  if (shouldUpsertByContentHash) {
    const contentHash = patch.content_hash;
    if (typeof contentHash !== "string" || contentHash.trim().length === 0) {
      const msg =
        "library_* staged changes require content_hash for insert/upsert.";
      await markFailed(msg);
      return json({ error: msg }, 400);
    }

    const { data: upserted, error: upsertErr } = await admin
      .from(staged.target_table)
      .upsert({ ...patch, content_hash: contentHash.trim() }, {
        onConflict: "content_hash",
      })
      .select("id")
      .single();

    if (upsertErr) {
      const msg = `Supabase upsert failure: ${upsertErr.message}`;
      await markFailed(msg);
      return json({ error: msg }, 500);
    }

    const { error: aErr } = await markApplied();

    if (aErr) {
      return json(
        {
          applied: true,
          row_id: upserted?.id,
          warning: "Patch applied but status update failed: " + aErr.message,
        },
        200,
      );
    }

    return json({
      applied: true,
      staged_change_id: staged.id,
      row_id: upserted?.id,
    });
  }

  // --- Optimistic concurrency: re-read + compare snapshot -----------------
  const selectCols = ["id", ...patchKeys].join(", ");
  const { data: row, error: rErr } = await admin
    .from(staged.target_table)
    .select(selectCols)
    .eq("id", staged.target_record_id)
    .maybeSingle();

  if (rErr || !row) {
    await markFailed("Target record not found");
    return json({ error: "Target record not found" }, 404);
  }

  const snapshot = (staged.original_snapshot as Record<string, unknown>) ?? {};
  const currentRow = row as unknown as Record<string, unknown>;
  for (const k of patchKeys) {
    if (!valuesEqual(currentRow[k], snapshot[k])) {
      await markFailed(
        `Live value of "${k}" has changed since proposal was created (stale).`,
      );
      return json(
        {
          error:
            `Stale proposal — live value of "${k}" no longer matches snapshot`,
        },
        409,
      );
    }
  }

  // --- Apply --------------------------------------------------------------
  const { error: uErr } = await admin
    .from(staged.target_table)
    .update(patch)
    .eq("id", staged.target_record_id);

  if (uErr) {
    await markFailed(uErr.message);
    return json({ error: `Apply failed: ${uErr.message}` }, 500);
  }

  const { error: aErr } = await markApplied();

  if (aErr) {
    return json(
      {
        applied: true,
        warning: "Patch applied but status update failed: " + aErr.message,
      },
      200,
    );
  }

  return json({ applied: true, staged_change_id: staged.id });
});
