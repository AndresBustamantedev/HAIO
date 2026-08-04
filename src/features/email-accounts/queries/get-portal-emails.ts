import "server-only"

import { createClient } from "@/lib/supabase/server"

export type PortalEmailAccount = {
  id: string
  address: string
  display_name: string | null
  status: string
}

export type PortalEmailService = {
  id: string
  provider_name: string
  plan_name: string | null
  status: string
  expires_on: string | null
  accounts: PortalEmailAccount[]
}

export async function getPortalEmails(
  clientId: string,
  projectId?: string,
): Promise<PortalEmailService[]> {
  const supabase = await createClient()

  let q = (supabase as any)
    .from("email_services")
    .select("id, provider_name, plan_name, status, expires_on")
    .eq("client_id", clientId)
    .eq("visible_in_portal", true)
    .is("deleted_at", null)
    .order("provider_name")

  if (projectId) q = q.eq("project_id", projectId)

  const { data: services, error } = await q

  if (error || !services || services.length === 0) return []

  const serviceIds = services.map((s: any) => s.id)

  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("id, address, display_name, status, email_service_id")
    .in("email_service_id", serviceIds)
    .is("deleted_at", null)
    .order("address")

  const byService = new Map<string, PortalEmailAccount[]>()
  for (const a of accounts ?? []) {
    if (!byService.has(a.email_service_id)) byService.set(a.email_service_id, [])
    byService.get(a.email_service_id)!.push({
      id: a.id,
      address: a.address,
      display_name: a.display_name,
      status: a.status,
    })
  }

  return services.map((svc: any) => ({
    id: svc.id,
    provider_name: svc.provider_name,
    plan_name: svc.plan_name,
    status: svc.status,
    expires_on: svc.expires_on,
    accounts: byService.get(svc.id) ?? [],
  }))
}
