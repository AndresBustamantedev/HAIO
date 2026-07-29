import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

// Server client: for Server Components, Server Actions and Route Handlers.
// Reads/writes the user's session via cookies, so all queries run as the
// signed-in user and respect Row Level Security.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component that
          // cannot set cookies (e.g. during static rendering). This is safe
          // to ignore as long as `proxy.ts` refreshes the session.
        }
      },
    },
  });
}
