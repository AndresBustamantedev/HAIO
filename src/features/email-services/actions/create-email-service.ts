"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { emailServiceSchema, type EmailServiceInput } from "@/features/email-services/schemas/email-service-schema"

type ActionResult = { error: string | null }

export async function createEmailService(input: EmailServiceInput): Promise<ActionResult> {
  const parsed = emailServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("email_services").insert({
    organization_id: organization.organizationId,
    client_id: parsed.data.client_id,
    provider_name: parsed.data.provider_name,
    plan_name: parsed.data.plan_name || null,
    status: parsed.data.status,
    starts_on: parsed.data.starts_on || null,
    expires_on: parsed.data.expires_on || null,
    renewal_price: parsed.data.renewal_price ? Number(parsed.data.renewal_price) : null,
    auto_renew: parsed.data.auto_renew,
    notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: "No se pudo crear el servicio de correo. " + error.message }
  }

  revalidatePath("/correos")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
