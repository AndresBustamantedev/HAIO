import "server-only"

import { createClient } from "@/lib/supabase/server"

export type ServiceOption = { id: string; name: string; default_price: number | null; currency_code: string }

/** Lightweight active-service list for selects (subscriptions, quote/invoice lines). */
export async function getServiceOptions(organizationId: string): Promise<ServiceOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("services")
    .select("id, name, default_price, currency_code")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
