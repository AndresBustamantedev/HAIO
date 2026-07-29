import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { ProviderWithAccounts } from "@/features/providers/types"

export type GetProvidersResult = {
  providers: ProviderWithAccounts[]
  total: number
  page: number
  pageSize: number
}

export async function getProviders(params: {
  organizationId: string
  search?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<GetProvidersResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50

  let query = supabase
    .from("providers")
    .select("*, provider_accounts(id, label)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("name", `%${term}%`)
  }

  if (params.category) {
    query = query.eq("category", params.category as never)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("name", { ascending: true }).range(from, to)

  if (error) throw new Error(error.message)

  return {
    providers: (data as ProviderWithAccounts[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
