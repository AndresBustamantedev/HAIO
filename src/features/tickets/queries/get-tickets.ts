import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { TicketWithClient } from "@/features/tickets/types"

export type GetTicketsParams = {
  organizationId: string
  search?: string
  status?: string
  priority?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetTicketsResult = {
  tickets: TicketWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered ticket list — all resolved server-side. */
export async function getTickets(params: GetTicketsParams): Promise<GetTicketsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("tickets")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`subject.ilike.%${term}%,ticket_number.ilike.%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as TicketWithClient["status"])
  }

  if (params.priority) {
    query = query.eq("priority", params.priority as TicketWithClient["priority"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    tickets: (data as TicketWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
