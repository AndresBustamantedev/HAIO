import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { InvoiceWithClient } from "@/features/invoices/types"

export type GetInvoicesParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetInvoicesResult = {
  invoices: InvoiceWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered invoice list — all resolved server-side. */
export async function getInvoices(params: GetInvoicesParams): Promise<GetInvoicesResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("invoices")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("invoice_number", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as InvoiceWithClient["status"])
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
    invoices: (data as InvoiceWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
