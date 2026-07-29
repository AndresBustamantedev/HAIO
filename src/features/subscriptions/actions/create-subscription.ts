"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { subscriptionSchema, type SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema"

type ActionResult = { error: string | null }

export async function createSubscription(input: SubscriptionInput): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("subscriptions").insert({
    organization_id: organization.organizationId,
    client_id: parsed.data.client_id,
    service_id: parsed.data.service_id,
    status: parsed.data.status,
    billing_interval: parsed.data.billing_interval,
    amount: Number(parsed.data.amount),
    current_period_start: parsed.data.current_period_start || null,
    current_period_end: parsed.data.current_period_end || null,
    cancel_at: parsed.data.cancel_at || null,
  })

  if (error) {
    return { error: "No se pudo crear la suscripción. " + error.message }
  }

  revalidatePath("/suscripciones")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
