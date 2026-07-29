"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { subscriptionSchema, type SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema"

type ActionResult = { error: string | null }

export async function updateSubscription(subscriptionId: string, input: SubscriptionInput): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("subscriptions")
    .update({
      client_id: parsed.data.client_id,
      service_id: parsed.data.service_id,
      status: parsed.data.status,
      billing_interval: parsed.data.billing_interval,
      amount: Number(parsed.data.amount),
      current_period_start: parsed.data.current_period_start || null,
      current_period_end: parsed.data.current_period_end || null,
      cancel_at: parsed.data.cancel_at || null,
    })
    .eq("id", subscriptionId)

  if (error) {
    return { error: "No se pudo actualizar la suscripción. " + error.message }
  }

  revalidatePath("/suscripciones")

  return { error: null }
}
