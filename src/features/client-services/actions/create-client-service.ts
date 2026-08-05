"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { clientServiceSchema, type ClientServiceInput } from "@/features/client-services/schemas/client-service-schema"

type ActionResult = { error: string | null }

export async function createClientService(
  clientId: string,
  input: ClientServiceInput,
  projectId?: string,
): Promise<ActionResult> {
  const parsed = clientServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createClient()

  const { error } = await (supabase as any).from("client_services").insert({
    organization_id: organization.organizationId,
    client_id: clientId,
    project_id: projectId ?? null,
    service_id: parsed.data.service_id,
    name_override: parsed.data.name_override || null,
    unit_price: Number(parsed.data.unit_price),
    quantity: Number(parsed.data.quantity),
    currency_code: parsed.data.currency_code,
    billing_interval: parsed.data.billing_interval || null,
    starts_on: parsed.data.starts_on || null,
    ends_on: parsed.data.ends_on || null,
    notes: parsed.data.notes || null,
    status: "active",
    auto_renew: true,
  })

  if (error) {
    return { error: "No se pudo guardar el servicio. " + error.message }
  }

  revalidatePath(`/clientes/${clientId}`)
  if (projectId) revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
