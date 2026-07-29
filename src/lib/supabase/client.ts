"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

// Browser client: safe to use in Client Components. Only ever uses the
// publishable (anon) key, never the secret key.
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabasePublishableKey());
}
