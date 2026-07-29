import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env";

// Admin client: uses the secret (service_role) key, which bypasses Row Level
// Security entirely. `import "server-only"` makes any accidental import from
// client code fail the build instead of leaking the key to the browser.
//
// Only use this for trusted server-side operations that intentionally need
// to cross organizations (e.g. Storage signed URLs, invite emails, cron
// jobs). Prefer `lib/supabase/server.ts` for anything a signed-in user does.
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
