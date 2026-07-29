import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { PaymentWithRelations } from "@/features/payments/types"

export type GetPaymentsParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetPaymentsResult = {
  payments: PaymentWithRelations[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered payment list — all resolved server-side. */
export async function getPayments(params: GetPaymentsParams): Promise<GetPaymentsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("payments")
    .select("*, clients(id, display_name), invoices(id, invoice_number)", { count: "exact" })
    .eq("organization_id", params.organizationId)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("reference", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as PaymentWithRelations["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("paid_at", { ascending: false, nullsFirst: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    payments: (data as PaymentWithRelations[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
