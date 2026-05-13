import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const missingEnv = [
  !supabaseUrl ? "VITE_SUPABASE_URL" : null,
  !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
].filter(Boolean);

if (missingEnv.length > 0 && import.meta.env.DEV) {
  throw new Error(
    `[ProseCraft] Missing staging Supabase environment variable(s): ${missingEnv.join(
      ", "
    )}. Copy .env.example to .env and use duplicated/staging Supabase credentials only.`
  );
}

if (
  import.meta.env.DEV &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  console.warn(
    "[ProseCraft] VITE_SUPABASE_PUBLISHABLE_KEY is deprecated; use VITE_SUPABASE_ANON_KEY for staging setup."
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl ?? "http://127.0.0.1:54321", supabaseAnonKey ?? "missing-anon-key", {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
