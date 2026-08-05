import "server-only"

import { createClient } from "@/lib/supabase/server"

export type CredentialClientSummary = {
  client_id: string | null
  client_name: string
  credential_count: number
  encrypted_count: number
}

/**
 * Returns one row per client (plus one "internal" row for null client_id)
 * with aggregated credential counts. Used by the /credenciales index page.
 * Never touches secret_ciphertext — uses v_credentials_safe.
 */
export async function getCredentialClientSummary(
  organizationId: string,
): Promise<CredentialClientSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("v_credentials_safe")
    .select("id, client_id, credential_mode, clients(id, display_name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)

  if (error || !data) return []

  const map = new Map<string, CredentialClientSummary>()

  for (const cred of data as any[]) {
    const key = cred.client_id ?? "__internal__"
    if (!map.has(key)) {
      map.set(key, {
        client_id: cred.client_id ?? null,
        client_name: cred.clients?.display_name ?? "Sin cliente (interno)",
        credential_count: 0,
        encrypted_count: 0,
      })
    }
    const entry = map.get(key)!
    entry.credential_count++
    if (cred.credential_mode === "encrypted") entry.encrypted_count++
  }

  return Array.from(map.values()).sort((a, b) =>
    a.client_name.localeCompare(b.client_name, "es"),
  )
}
