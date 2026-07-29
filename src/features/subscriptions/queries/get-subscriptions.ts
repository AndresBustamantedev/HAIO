import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { SubscriptionWithRelations } from "@/features/subscriptions/types"

export type GetSubscriptionsParams = {
  organizationId: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetSubscriptionsResult = {
  subscriptions: SubscriptionWithRelations[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered subscription list — all resolved server-side. */
export async function getSubscriptions(params: GetSubscriptionsParams): Promise<GetSubscriptionsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("subscriptions")
    .select("*, clients(id, display_name), services(id, name)", { count: "exact" })
    .eq("organization_id", params.organizationId)

  if (params.status) {
    query = query.eq("status", params.status as SubscriptionWithRelations["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order("current_period_end", { ascending: true, nullsFirst: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    subscriptions: (data as SubscriptionWithRelations[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
