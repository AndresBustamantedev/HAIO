"use server"

import { revalidatePath } from "next/cache"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { databaseSchema, type DatabaseInput } from "@/features/databases/schemas/database-schema"

type ActionResult = { error: string | null }

export async function createDatabase(input: DatabaseInput): Promise<ActionResult> {
  const parsed = databaseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("databases").insert({
    organization_id: organization.organizationId,
    client_id:      parsed.data.client_id,
    project_id:     parsed.data.project_id || null,
    name:           parsed.data.name,
    engine:         parsed.data.engine,
    engine_version: parsed.data.engine_version || null,
    provider:       parsed.data.provider || null,
    host:           parsed.data.host || null,
    status:         parsed.data.status,
    notes:          parsed.data.notes || null,
  })

  if (error) {
    return { error: "No se pudo crear la base de datos. " + error.message }
  }

  revalidatePath(`/clientes/${parsed.data.client_id}`)
  if (parsed.data.project_id) {
    revalidatePath(`/proyectos/${parsed.data.project_id}`)
  }

  return { error: null }
}
