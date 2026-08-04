"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { decryptSecret } from "@/features/integrations/services/encryption"

export async function revealEmailPassword(
  accountId: string,
): Promise<{ password: string | null; error: string | null }> {
  const organization = await getCurrentOrganization()
  if (!organization) return { password: null, error: "Sin autorización." }

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from("email_accounts")
    .select("password_ciphertext, organization_id")
    .eq("id", accountId)
    .maybeSingle()

  if (error || !data) return { password: null, error: "Cuenta no encontrada." }
  if (data.organization_id !== organization.organizationId)
    return { password: null, error: "Sin autorización." }
  if (!data.password_ciphertext) return { password: null, error: null }

  try {
    const password = decryptSecret(data.password_ciphertext)
    return { password, error: null }
  } catch {
    return { password: null, error: "No se pudo descifrar la contraseña." }
  }
}
