"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { emailServiceSchema, type EmailServiceInput } from "@/features/email-services/schemas/email-service-schema"

type ActionResult = { error: string | null }

export async function updateEmailService(emailServiceId: string, input: EmailServiceInput): Promise<ActionResult> {
  const parsed = emailServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("email_services")
    .update({
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
    .eq("id", emailServiceId)

  if (error) {
    return { error: "No se pudo actualizar el servicio de correo. " + error.message }
  }

  revalidatePath("/correos")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
