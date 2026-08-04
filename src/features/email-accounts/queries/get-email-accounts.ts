import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { EmailAccountWithService, EmailServiceOption } from "@/features/email-accounts/types"

export type GetEmailAccountsResult = {
  accounts: EmailAccountWithService[]
  total: number
  page: number
  pageSize: number
}

export async function getEmailAccounts(params: {
  organizationId: string
  search?: string
  emailServiceId?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<GetEmailAccountsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50

  let query = supabase
    .from("email_accounts")
    .select("*, email_services(id, provider_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("address", `%${term}%`)
  }

  if (params.emailServiceId) query = query.eq("email_service_id", params.emailServiceId)
  if (params.status) query = query.eq("status", params.status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("address", { ascending: true }).range(from, to)

  if (error) throw new Error(error.message)

  return {
    accounts: (data as EmailAccountWithService[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getEmailServiceOptions(organizationId: string): Promise<EmailServiceOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("email_services")
    .select("id, provider_name")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("provider_name", { ascending: true })

  if (error || !data) return []

  return data
}

export async function getEmailServiceOptionsByClient(
  organizationId: string,
  clientId: string,
): Promise<EmailServiceOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("email_services")
    .select("id, provider_name")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("provider_name", { ascending: true })

  if (error || !data) return []

  return data
}
