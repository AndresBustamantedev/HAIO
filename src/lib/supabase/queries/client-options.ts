import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type ClientOption = Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name">

/** Lightweight client list for selects/filters — id + display_name only. Shared across every module that links records to a client. */
export async function getClientOptions(organizationId: string): Promise<ClientOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("display_name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export type ProjectOption = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name" | "client_id">

/** Lightweight project list for selects/filters — id + name + client_id only. */
export async function getProjectOptions(organizationId: string): Promise<ProjectOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, client_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
