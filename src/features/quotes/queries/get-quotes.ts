import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { QuoteWithClient } from "@/features/quotes/types"

export type GetQuotesParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetQuotesResult = {
  quotes: QuoteWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered quote list — all resolved server-side. */
export async function getQuotes(params: GetQuotesParams): Promise<GetQuotesResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("quotes")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("quote_number", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as QuoteWithClient["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("issue_date", { ascending: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    quotes: (data as QuoteWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
