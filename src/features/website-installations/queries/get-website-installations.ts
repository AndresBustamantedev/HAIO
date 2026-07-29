import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { WebsiteInstallationWithClient } from "@/features/website-installations/types"

export type GetWebsiteInstallationsResult = {
  installations: WebsiteInstallationWithClient[]
  total: number
  page: number
  pageSize: number
}

export async function getWebsiteInstallations(params: {
  organizationId: string
  search?: string
  clientId?: string
  cmsType?: string
  environment?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<GetWebsiteInstallationsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50

  let query = supabase
    .from("website_installations")
    .select("*, clients(id, display_name), hosting_sites(id, site_label)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("name", `%${term}%`)
  }

  if (params.clientId) query = query.eq("client_id", params.clientId)
  if (params.cmsType) query = query.eq("cms_type", params.cmsType)
  if (params.environment) query = query.eq("environment", params.environment)
  if (params.status) query = query.eq("status", params.status)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("name", { ascending: true }).range(from, to)

  if (error) throw new Error(error.message)

  return {
    installations: (data as WebsiteInstallationWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}

// Lightweight options for selects in credential form, etc.
export type WebsiteInstallationOption = {
  id: string
  name: string
}

export async function getWebsiteInstallationOptions(organizationId: string): Promise<WebsiteInstallationOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("website_installations")
    .select("id, name")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (error || !data) return []

  return data
}
