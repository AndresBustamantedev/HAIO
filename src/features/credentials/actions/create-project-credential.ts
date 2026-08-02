"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { credentialSchema, type CredentialInput } from "@/features/credentials/schemas/credential-schema"

type Result = { error: string | null }

export async function createProjectCredential(
  projectId: string,
  clientId: string,
  input: CredentialInput
): Promise<Result> {
  const parsed = credentialSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const org = await getCurrentOrganization()
  if (!org) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("credentials").insert({
    organization_id: org.organizationId,
    project_id: projectId,
    client_id: clientId || null,
    label: parsed.data.label,
    type: parsed.data.type as string,
    username: parsed.data.username || null,
    login_url: parsed.data.login_url || null,
    secret_reference: parsed.data.secret_reference || null,
    expires_at: parsed.data.expires_at || null,
    is_shared_with_client: parsed.data.is_shared_with_client,
    notes: parsed.data.notes || null,
    created_by: user?.id ?? null,
    updated_by: user?.id ?? null,
  })

  if (error) return { error: "No se pudo crear la credencial. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/credenciales")
  return { error: null }
}
