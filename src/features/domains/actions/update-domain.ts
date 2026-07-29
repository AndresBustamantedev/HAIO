"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { domainSchema, type DomainInput } from "@/features/domains/schemas/domain-schema"

type ActionResult = { error: string | null }

export async function updateDomain(domainId: string, input: DomainInput): Promise<ActionResult> {
  const parsed = domainSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("domains")
    .update({
      client_id: parsed.data.client_id,
      domain_name: parsed.data.domain_name,
      status: parsed.data.status,
      registrar_name: parsed.data.registrar_name || null,
      registered_on: parsed.data.registered_on || null,
      expires_on: parsed.data.expires_on || null,
      renewal_price: parsed.data.renewal_price ? Number(parsed.data.renewal_price) : null,
      auto_renew: parsed.data.auto_renew,
      managed_by_us: parsed.data.managed_by_us,
      privacy_enabled: parsed.data.privacy_enabled,
      notes: parsed.data.notes || null,
    })
    .eq("id", domainId)

  if (error) {
    return { error: "No se pudo actualizar el dominio. " + error.message }
  }

  revalidatePath("/dominios")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
