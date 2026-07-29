"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { hostingSchema, type HostingInput } from "@/features/hosting/schemas/hosting-schema"

type ActionResult = { error: string | null }

export async function updateHosting(hostingId: string, input: HostingInput): Promise<ActionResult> {
  const parsed = hostingSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("hosting_accounts")
    .update({
      client_id: parsed.data.client_id,
      provider_name: parsed.data.provider_name,
      plan_name: parsed.data.plan_name || null,
      status: parsed.data.status,
      panel_url: parsed.data.panel_url || null,
      server_hostname: parsed.data.server_hostname || null,
      starts_on: parsed.data.starts_on || null,
      expires_on: parsed.data.expires_on || null,
      renewal_price: parsed.data.renewal_price ? Number(parsed.data.renewal_price) : null,
      auto_renew: parsed.data.auto_renew,
      notes: parsed.data.notes || null,
    })
    .eq("id", hostingId)

  if (error) {
    return { error: "No se pudo actualizar el hosting. " + error.message }
  }

  revalidatePath("/hosting")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
