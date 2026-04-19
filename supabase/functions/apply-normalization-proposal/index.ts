// Apply an approved normalization proposal to the live record.
//
// Flow:
//   1. Verify caller is an authenticated admin (via JWT + has_role RPC).
//   2. Load the proposal (must be status=pending).
//   3. Re-read the live row and verify current_value still matches the
//      snapshot taken at proposal time (optimistic concurrency).
//   4. Apply the patch (scalar replace OR array-tag replace+dedupe).
//   5. Mark proposal approved with reviewed_by/reviewed_at; on failure,
//      mark failed with apply_error.
//
// Service role is used for the live write so we can target any whitelisted
// table without per-table client config.

import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

// Tables eligible for normalization. Must match the Vocabulary audit registry.
const ALLOWED_TABLES = new Set([
  "questions",
  "quote_methods",
  "theme_maps",
  "ao5_tensions",
  "theses",
  "paragraph_jobs",
  "character_cards",
  "symbol_entries",
  "comparative_matrix",
]);

interface ApplyBody {
  proposal_id: string;
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Auth: verify caller is admin ----------------------------------------
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

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return json({ error: "Forbidden — admin only" }, 403);
  }

  // --- Parse + load proposal -----------------------------------------------
  let body: ApplyBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body?.proposal_id || typeof body.proposal_id !== "string") {
    return json({ error: "proposal_id is required" }, 400);
  }

  // Service-role client for everything below.
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: proposal, error: pErr } = await admin
    .from("normalization_proposals")
    .select("*")
    .eq("id", body.proposal_id)
    .maybeSingle();
  if (pErr || !proposal) {
    return json({ error: "Proposal not found" }, 404);
  }
  if (proposal.status !== "pending") {
    return json(
      { error: `Proposal is already ${proposal.status}` },
      409,
    );
  }
  if (!ALLOWED_TABLES.has(proposal.target_table)) {
    return json({ error: "Target table not allowed" }, 400);
  }

  // --- Read live row + verify snapshot -------------------------------------
  const { data: row, error: rErr } = await admin
    .from(proposal.target_table)
    .select(`id, ${proposal.target_field}`)
    .eq("id", proposal.target_record_id)
    .maybeSingle();
  if (rErr || !row) {
    await admin
      .from("normalization_proposals")
      .update({
        status: "failed",
        apply_error: "Target record not found",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);
    return json({ error: "Target record not found" }, 404);
  }

  const liveValue = (row as Record<string, unknown>)[proposal.target_field];
  if (!valuesEqual(liveValue, proposal.current_value)) {
    await admin
      .from("normalization_proposals")
      .update({
        status: "failed",
        apply_error:
          "Live value has changed since proposal was created (stale).",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);
    return json(
      { error: "Stale proposal — live value no longer matches snapshot" },
      409,
    );
  }

  // --- Apply patch ---------------------------------------------------------
  // proposed_value is stored as the FULL replacement value (scalar OR full
  // post-replace array). The Vocabulary UI computes the array transform
  // before submitting so this function stays neutral about field semantics.
  const patch: Record<string, unknown> = {
    [proposal.target_field]: proposal.proposed_value,
  };

  const { error: uErr } = await admin
    .from(proposal.target_table)
    .update(patch)
    .eq("id", proposal.target_record_id);

  if (uErr) {
    await admin
      .from("normalization_proposals")
      .update({
        status: "failed",
        apply_error: uErr.message,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);
    return json({ error: `Apply failed: ${uErr.message}` }, 500);
  }

  // --- Mark approved -------------------------------------------------------
  const { error: aErr } = await admin
    .from("normalization_proposals")
    .update({
      status: "approved",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      apply_error: null,
    })
    .eq("id", proposal.id);

  if (aErr) {
    // Patch was applied but status update failed — surface clearly.
    return json(
      {
        warning:
          "Patch applied but proposal status update failed: " + aErr.message,
        applied: true,
      },
      200,
    );
  }

  return json({ applied: true, proposal_id: proposal.id });
});
