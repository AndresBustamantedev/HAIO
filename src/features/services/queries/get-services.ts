import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Service } from "@/features/services/types"

export type GetServicesParams = {
  organizationId: string
  search?: string
  category?: string
  page?: number
  pageSize?: number
}

export type GetServicesResult = {
  services: Service[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered service-catalog list — all resolved server-side. */
export async function getServices(params: GetServicesParams): Promise<GetServicesResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("services")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
  }

  if (params.category) {
    query = query.eq("category", params.category as Service["category"])
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("name", { ascending: true }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    services: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
