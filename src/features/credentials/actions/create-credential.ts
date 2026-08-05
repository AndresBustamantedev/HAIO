"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { credentialSchema, type CredentialInput } from "@/features/credentials/schemas/credential-schema"

type ActionResult = { error: string | null }

export async function createCredential(input: CredentialInput): Promise<ActionResult> {
  const parsed = credentialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("credentials").insert({
    organization_id: organization.organizationId,
    label: parsed.data.label,
    type: parsed.data.type,
    client_id: parsed.data.client_id || null,
    username: parsed.data.username || null,
    login_url: parsed.data.login_url || null,
    secret_reference: parsed.data.secret_reference || null,
    expires_at: parsed.data.expires_at || null,
    is_shared_with_client: parsed.data.is_shared_with_client,
    notes: parsed.data.notes || null,
    created_by: user?.id ?? null,
    updated_by: user?.id ?? null,
  }).select("id").single()

  if (error) {
    return { error: "No se pudo crear la credencial. " + error.message }
  }

  if (parsed.data.project_ids?.length && data?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("credential_project_assignments").insert(
      parsed.data.project_ids.map((pid) => ({
        credential_id: data.id,
        project_id: pid,
      })),
    )
  }

  revalidatePath("/credenciales")

  return { error: null }
}
