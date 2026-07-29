import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Client } from "@/features/clients/types"

const SORTABLE_COLUMNS = ["display_name", "created_at", "status"] as const
type SortableColumn = (typeof SORTABLE_COLUMNS)[number]

export type GetClientsParams = {
  organizationId: string
  search?: string
  status?: string
  page?: number
  pageSize?: number
  sort?: string
  dir?: "asc" | "desc"
}

export type GetClientsResult = {
  clients: Client[]
  total: number
  page: number
  pageSize: number
}

function isSortable(value: string | undefined): value is SortableColumn {
  return !!value && (SORTABLE_COLUMNS as readonly string[]).includes(value)
}

/** Paginated, filtered, sorted client list — all resolved server-side. */
export async function getClients(params: GetClientsParams): Promise<GetClientsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20
  const sortColumn = isSortable(params.sort) ? params.sort : "created_at"
  const ascending = params.dir === "asc"

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(
      `display_name.ilike.%${term}%,legal_name.ilike.%${term}%,tax_id.ilike.%${term}%,email.ilike.%${term}%`
    )
  }

  if (params.status) {
    query = query.eq("status", params.status as Client["status"])
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order(sortColumn, { ascending })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    clients: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
