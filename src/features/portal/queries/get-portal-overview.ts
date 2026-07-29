import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type PortalProject = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "name" | "status" | "start_date" | "target_date" | "description"
>

export type PortalInvoice = Database["public"]["Views"]["v_invoice_balances"]["Row"]

export type PortalDocument = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "title" | "category" | "created_at" | "storage_path" | "size_bytes"
>

export type PortalTicket = Pick<
  Database["public"]["Tables"]["tickets"]["Row"],
  "id" | "subject" | "status" | "priority" | "created_at" | "updated_at"
>

export type PortalOverview = {
  projects: PortalProject[]
  invoices: PortalInvoice[]
  documents: PortalDocument[]
  tickets: PortalTicket[]
}

export async function getPortalOverview(clientId: string): Promise<PortalOverview> {
  const supabase = await createClient()

  const [projects, invoices, documents, tickets] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, start_date, target_date, description")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("v_invoice_balances")
      .select("*")
      .eq("client_id", clientId)
      .order("due_date", { ascending: false })
      .limit(5),
    supabase
      .from("documents")
      .select("id, title, category, created_at, storage_path, size_bytes")
      .eq("client_id", clientId)
      .eq("is_visible_to_client", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tickets")
      .select("id, subject, status, priority, created_at, updated_at")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(5),
  ])

  return {
    projects: (projects.data ?? []) as PortalProject[],
    invoices: invoices.data ?? [],
    documents: (documents.data ?? []) as PortalDocument[],
    tickets: (tickets.data ?? []) as PortalTicket[],
  }
}
