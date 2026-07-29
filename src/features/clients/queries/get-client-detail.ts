import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type ClientDetail = {
  client: Database["public"]["Tables"]["clients"]["Row"]
  contacts: Database["public"]["Tables"]["client_contacts"]["Row"][]
  projects: Database["public"]["Tables"]["projects"]["Row"][]
  services: Array<
    Database["public"]["Tables"]["client_services"]["Row"] & {
      services: Pick<Database["public"]["Tables"]["services"]["Row"], "name" | "category"> | null
    }
  >
  domains: Database["public"]["Tables"]["domains"]["Row"][]
  hostingAccounts: Database["public"]["Tables"]["hosting_accounts"]["Row"][]
  invoices: Database["public"]["Views"]["v_invoice_balances"]["Row"][]
  documents: Database["public"]["Tables"]["documents"]["Row"][]
  activity: Database["public"]["Tables"]["activity_logs"]["Row"][]
}

/**
 * Everything the client detail page needs, fetched in parallel. Every table
 * is scoped to `client_id` and protected by RLS — a client from another
 * organization simply returns null/empty here, not an error.
 */
export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = await createClient()

  const clientRes = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .is("deleted_at", null)
    .maybeSingle()

  if (clientRes.error || !clientRes.data) {
    return null
  }

  const [contacts, projects, services, domains, hostingAccounts, invoices, documents, activity] =
    await Promise.all([
      supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_services")
        .select("*, services(name, category)")
        .eq("client_id", clientId)
        .is("deleted_at", null),
      supabase
        .from("domains")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("expires_on", { ascending: true }),
      supabase
        .from("hosting_accounts")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null),
      supabase
        .from("v_invoice_balances")
        .select("*")
        .eq("client_id", clientId)
        .order("due_date", { ascending: false })
        .limit(10),
      supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .order("created_at", { ascending: false })
        .limit(15),
    ])

  return {
    client: clientRes.data,
    contacts: contacts.data ?? [],
    projects: projects.data ?? [],
    services: services.data ?? [],
    domains: domains.data ?? [],
    hostingAccounts: hostingAccounts.data ?? [],
    invoices: invoices.data ?? [],
    documents: documents.data ?? [],
    activity: activity.data ?? [],
  }
}
