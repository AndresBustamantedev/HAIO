"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function cancelSubscription(subscriptionId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", subscriptionId)

  if (error) {
    return { error: "No se pudo cancelar la suscripción. " + error.message }
  }

  revalidatePath("/suscripciones")

  return { error: null }
}
