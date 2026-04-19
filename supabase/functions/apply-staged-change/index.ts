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
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

// Whitelist: which fields each table allows the apply step to write.
// Keep tight — anything not listed here will be rejected even if a proposal
// somehow contains it. Extend as new edit surfaces are added.
const FIELD_WHITELIST: Record<string, Set<string>> = {
  questions: new Set(["family", "level_tag", "primary_route_id", "secondary_route_id", "likely_core_methods"]),
  quote_methods: new Set(["source_text", "level_tag", "method", "best_themes"]),
  theme_maps: new Set(["family"]),
  ao5_tensions: new Set(["level_tag"]),
  theses: new Set(["theme_family", "level", "route_id"]),
  paragraph_jobs: new Set(["question_family", "route_id"]),
  character_cards: new Set(["source_text", "themes"]),
  symbol_entries: new Set(["source_text", "themes"]),
  comparative_matrix: new Set(["axis", "themes"]),
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Auth ----------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;

  const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) return json({ error: "Forbidden — admin only" }, 403);

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

  // --- Whitelist checks ---------------------------------------------------
  const allowedFields = FIELD_WHITELIST[staged.target_table];
  if (!allowedFields) return json({ error: "Target table not allowed" }, 400);

  const patch = staged.proposed_patch as Record<string, unknown>;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return json({ error: "proposed_patch must be a JSON object" }, 400);
  }
  const patchKeys = Object.keys(patch);
  if (patchKeys.length === 0) return json({ error: "proposed_patch is empty" }, 400);

  const declaredFields = new Set<string>(staged.changed_fields ?? []);
  for (const k of patchKeys) {
    if (!declaredFields.has(k)) {
      return json({ error: `Patch field "${k}" not declared in changed_fields` }, 400);
    }
    if (!allowedFields.has(k)) {
      return json({ error: `Field "${k}" is not writable for table ${staged.target_table}` }, 400);
    }
  }

  // --- Optimistic concurrency: re-read + compare snapshot -----------------
  const selectCols = ["id", ...patchKeys].join(", ");
  const { data: row, error: rErr } = await admin
    .from(staged.target_table)
    .select(selectCols)
    .eq("id", staged.target_record_id)
    .maybeSingle();

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

  if (rErr || !row) {
    await markFailed("Target record not found");
    return json({ error: "Target record not found" }, 404);
  }

  const snapshot = (staged.original_snapshot as Record<string, unknown>) ?? {};
  for (const k of patchKeys) {
    if (!valuesEqual((row as Record<string, unknown>)[k], snapshot[k])) {
      await markFailed(`Live value of "${k}" has changed since proposal was created (stale).`);
      return json(
        { error: `Stale proposal — live value of "${k}" no longer matches snapshot` },
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

  const { error: aErr } = await admin
    .from("staged_changes")
    .update({
      status: "applied",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      apply_error: null,
    })
    .eq("id", staged.id);

  if (aErr) {
    return json(
      { applied: true, warning: "Patch applied but status update failed: " + aErr.message },
      200,
    );
  }

  return json({ applied: true, staged_change_id: staged.id });
});
