import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { HostingWithClient } from "@/features/hosting/types"

export type GetHostingAccountsParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetHostingAccountsResult = {
  hostingAccounts: HostingWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered hosting-account list across every client. */
export async function getHostingAccounts(params: GetHostingAccountsParams): Promise<GetHostingAccountsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("hosting_accounts")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`provider_name.ilike.%${term}%,plan_name.ilike.%${term}%,server_hostname.ilike.%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as HostingWithClient["status"])
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
    hostingAccounts: (data as HostingWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
