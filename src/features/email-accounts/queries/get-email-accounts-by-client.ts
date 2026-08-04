import "server-only"

import { createClient } from "@/lib/supabase/server"

export type EmailAccountRow = {
  id: string
  address: string
  display_name: string | null
  status: string
  has_password: boolean
  quota_mb: number | null
  forwards_to: string[]
  notes: string | null
}

export type EmailServiceGroup = {
  id: string
  provider_name: string
  plan_name: string | null
  status: string
  expires_on: string | null
  visible_in_portal: boolean
  accounts: EmailAccountRow[]
}

export type ClientEmailGroup = {
  client_id: string
  client_name: string
  services: EmailServiceGroup[]
}

export async function getEmailAccountsByClient(
  organizationId: string,
  clientId?: string,
): Promise<ClientEmailGroup[]> {
  const supabase = await createClient()

  let servicesQuery = supabase
    .from("email_services")
    .select(`
      id,
      provider_name,
      plan_name,
      status,
      expires_on,
      visible_in_portal,
      clients!email_services_client_id_fkey(id, display_name)
    `)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("provider_name")

  if (clientId) servicesQuery = servicesQuery.eq("client_id", clientId)

  const { data: services, error } = await servicesQuery

  if (error || !services) return []

  // Fetch accounts for all services
  const serviceIds = services.map((s: any) => s.id)
  if (serviceIds.length === 0) return []

  const { data: accounts } = await (supabase as any)
    .from("email_accounts")
    .select("id, address, display_name, status, quota_mb, forwards_to, notes, password_ciphertext, email_service_id")
    .in("email_service_id", serviceIds)
    .is("deleted_at", null)
    .order("address")

  const accountsByService = new Map<string, EmailAccountRow[]>()
  for (const a of accounts ?? []) {
    if (!accountsByService.has(a.email_service_id)) {
      accountsByService.set(a.email_service_id, [])
    }
    accountsByService.get(a.email_service_id)!.push({
      id: a.id,
      address: a.address,
      display_name: a.display_name,
      status: a.status,
      has_password: !!a.password_ciphertext,
      quota_mb: a.quota_mb ?? null,
      forwards_to: a.forwards_to ?? [],
      notes: a.notes,
    })
  }

  // Group services by client
  const clientMap = new Map<string, ClientEmailGroup>()
  for (const svc of services as any[]) {
    const client = svc.clients
    if (!client) continue
    if (!clientMap.has(client.id)) {
      clientMap.set(client.id, {
        client_id: client.id,
        client_name: client.display_name,
        services: [],
      })
    }
    clientMap.get(client.id)!.services.push({
      id: svc.id,
      provider_name: svc.provider_name,
      plan_name: svc.plan_name,
      status: svc.status,
      expires_on: svc.expires_on,
      visible_in_portal: svc.visible_in_portal ?? false,
      accounts: accountsByService.get(svc.id) ?? [],
    })
  }

  return Array.from(clientMap.values()).sort((a, b) =>
    a.client_name.localeCompare(b.client_name),
  )
}
