"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { credentialSchema, type CredentialInput } from "@/features/credentials/schemas/credential-schema"

type ActionResult = { error: string | null }

export async function updateCredential(credentialId: string, input: CredentialInput): Promise<ActionResult> {
  const parsed = credentialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("credentials")
    .update({
      label: parsed.data.label,
      type: parsed.data.type,
      client_id: parsed.data.client_id || null,
      username: parsed.data.username || null,
      login_url: parsed.data.login_url || null,
      secret_reference: parsed.data.secret_reference || null,
      expires_at: parsed.data.expires_at || null,
      is_shared_with_client: parsed.data.is_shared_with_client,
      notes: parsed.data.notes || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", credentialId)

  if (error) {
    return { error: "No se pudo actualizar la credencial. " + error.message }
  }

  revalidatePath("/credenciales")

  return { error: null }
}
