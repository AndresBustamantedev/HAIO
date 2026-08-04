"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { clientSchema, type ClientInput } from "@/features/clients/schemas/client-schema"

type ActionResult = { error: string | null; clientId?: string }

export async function createClient(input: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organization.organizationId,
      display_name: parsed.data.display_name,
      type: parsed.data.type,
      status: parsed.data.status,
      legal_name: parsed.data.legal_name || null,
      tax_id: parsed.data.tax_id || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      city: parsed.data.city || null,
      notes: parsed.data.notes || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505" && error.message.includes("uq_clients_org_tax_id")) {
      return { error: "Ya existe un cliente activo con ese NIF/CIF en esta organización." }
    }
    return { error: "No se pudo crear el cliente. " + error.message }
  }

  revalidatePath("/clientes")
  revalidatePath("/dashboard")

  return { error: null, clientId: data.id }
}
