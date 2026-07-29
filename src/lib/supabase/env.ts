// Centralised, validated access to the Supabase environment variables.
// Accepts both the current Supabase key names and the legacy ones (see
// DATABASE.md section 25) so the app keeps working regardless of which
// naming convention the connected project uses.

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return required(key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabaseSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  return required(key, "SUPABASE_SECRET_KEY");
}
