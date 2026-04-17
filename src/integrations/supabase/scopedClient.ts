// Wrapper that adds the `x-device-id` header to every Supabase request,
// so the `is_owner(user_id, device_id)` RLS policy can scope anonymous
// rows to this browser. Use this client for any read/write of
// saved_essay_plans, timed_sessions, or reflection_entries.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getDeviceId } from "./deviceId";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabaseScoped = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "c2p.sb.auth.v1",
    },
    global: {
      headers: {
        "x-device-id": getDeviceId(),
      },
    },
  }
);

/** The current owner identity to write into rows we insert. */
export async function getOwnerKeys(): Promise<{ user_id: string | null; device_id: string }> {
  const { data } = await supabaseScoped.auth.getUser();
  return {
    user_id: data.user?.id ?? null,
    device_id: getDeviceId(),
  };
}
