import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { DomainWithClient } from "@/features/domains/types"

export type GetDomainsParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetDomainsResult = {
  domains: DomainWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered domain list across every client — all resolved server-side. */
export async function getDomains(params: GetDomainsParams): Promise<GetDomainsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("domains")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("domain_name", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as DomainWithClient["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("expires_on", { ascending: true }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    domains: (data as DomainWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
