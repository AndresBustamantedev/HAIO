import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { ContactWithClient } from "@/features/contacts/types"

export type GetContactsParams = {
  organizationId: string
  search?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetContactsResult = {
  contacts: ContactWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered contact list across every client — all resolved server-side. */
export async function getContacts(params: GetContactsParams): Promise<GetContactsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("client_contacts")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,job_title.ilike.%${term}%`)
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order("is_primary", { ascending: false })
    .order("full_name", { ascending: true })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    contacts: (data as ContactWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
