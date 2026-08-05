import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

// ----- Enriched row types -----

type ProviderAccountSnippet = {
  id: string
  label: string
  providers: { id: string; name: string } | null
} | null

export type DomainWithProvider = Database["public"]["Tables"]["domains"]["Row"] & {
  provider_accounts: ProviderAccountSnippet
}

export type HostingWithProvider = Database["public"]["Tables"]["hosting_accounts"]["Row"] & {
  provider_accounts: ProviderAccountSnippet
}

export type EmailServiceWithAccounts = Database["public"]["Tables"]["email_services"]["Row"] & {
  email_accounts: Pick<
    Database["public"]["Tables"]["email_accounts"]["Row"],
    "id" | "address" | "display_name" | "status"
  >[]
}

export type WebInstallationWithSite =
  Database["public"]["Tables"]["website_installations"]["Row"] & {
    hosting_sites: Pick<
      Database["public"]["Tables"]["hosting_sites"]["Row"],
      "id" | "site_label"
    > | null
  }

export type CredentialSafeSnippet = Database["public"]["Views"]["v_credentials_safe"]["Row"]

export type BackupConfigSnippet = Database["public"]["Tables"]["backup_configurations"]["Row"]

// ----- Full detail type -----

export type ClientDetail = {
  client: Database["public"]["Tables"]["clients"]["Row"]
  contacts: Database["public"]["Tables"]["client_contacts"]["Row"][]
  projects: Database["public"]["Tables"]["projects"]["Row"][]
  services: Array<
    Database["public"]["Tables"]["client_services"]["Row"] & {
      services: Pick<Database["public"]["Tables"]["services"]["Row"], "name" | "category"> | null
    }
  >
  domains: DomainWithProvider[]
  hostingAccounts: HostingWithProvider[]
  emailServices: EmailServiceWithAccounts[]
  websiteInstallations: WebInstallationWithSite[]
  credentials: CredentialSafeSnippet[]
  backupConfigs: BackupConfigSnippet[]
  invoices: Database["public"]["Views"]["v_invoice_balances"]["Row"][]
  documents: Database["public"]["Tables"]["documents"]["Row"][]
  activity: Database["public"]["Tables"]["activity_logs"]["Row"][]
}

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

  const [
    contacts,
    projects,
    services,
    domains,
    hostingAccounts,
    emailServices,
    websiteInstallations,
    credentials,
    backupConfigs,
    invoices,
    documents,
    activity,
  ] = await Promise.all([
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
      .select("*, provider_accounts(id, label, providers(id, name))")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("expires_on", { ascending: true }),
    supabase
      .from("hosting_accounts")
      .select("*, provider_accounts(id, label, providers(id, name))")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("expires_on", { ascending: true }),
    supabase
      .from("email_services")
      .select("*, email_accounts(id, address, display_name, status)")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("provider_name", { ascending: true }),
    supabase
      .from("website_installations")
      .select("*, hosting_sites(id, site_label)")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("v_credentials_safe")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .limit(10),
    supabase
      .from("backup_configurations")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .limit(5),
    supabase
      .from("v_invoice_balances")
      .select("*")
      .eq("client_id", clientId)
      .order("due_date", { ascending: false })
      .limit(50),
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
    domains: (domains.data as DomainWithProvider[]) ?? [],
    hostingAccounts: (hostingAccounts.data as HostingWithProvider[]) ?? [],
    emailServices: (emailServices.data as EmailServiceWithAccounts[]) ?? [],
    websiteInstallations: (websiteInstallations.data as WebInstallationWithSite[]) ?? [],
    credentials: (credentials.data as CredentialSafeSnippet[]) ?? [],
    backupConfigs: (backupConfigs.data as BackupConfigSnippet[]) ?? [],
    invoices: invoices.data ?? [],
    documents: documents.data ?? [],
    activity: activity.data ?? [],
  }
}
