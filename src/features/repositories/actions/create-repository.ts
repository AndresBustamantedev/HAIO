"use server"

import { revalidatePath } from "next/cache"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { repositorySchema, type RepositoryInput } from "@/features/repositories/schemas/repository-schema"

type ActionResult = { error: string | null }

export async function createRepository(input: RepositoryInput): Promise<ActionResult> {
  const parsed = repositorySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("repositories").insert({
    organization_id: organization.organizationId,
    client_id:  parsed.data.client_id,
    project_id: parsed.data.project_id || null,
    name:       parsed.data.name,
    provider:   parsed.data.provider || "",
    url:        parsed.data.url || null,
    visibility: parsed.data.visibility ?? "private",
    status:     parsed.data.status,
    notes:      parsed.data.notes || null,
  })

  if (error) {
    return { error: "No se pudo crear el repositorio. " + error.message }
  }

  revalidatePath(`/clientes/${parsed.data.client_id}`)
  if (parsed.data.project_id) {
    revalidatePath(`/proyectos/${parsed.data.project_id}`)
  }

  return { error: null }
}
