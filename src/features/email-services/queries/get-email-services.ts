import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { EmailServiceWithClient } from "@/features/email-services/types"

export type GetEmailServicesParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetEmailServicesResult = {
  emailServices: EmailServiceWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered email-service list across every client. */
export async function getEmailServices(params: GetEmailServicesParams): Promise<GetEmailServicesResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("email_services")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`provider_name.ilike.%${term}%,plan_name.ilike.%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as EmailServiceWithClient["status"])
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
    emailServices: (data as EmailServiceWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
