import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type PortalAccess = {
  id: string
  client_id: string
  organization_id: string
  can_view_projects: boolean
  can_view_invoices: boolean
  can_view_documents: boolean
  can_create_tickets: boolean
  client: Database["public"]["Tables"]["clients"]["Row"]
}

export type PortalSession = {
  userId: string
  userEmail: string | undefined
  access: PortalAccess
}

/** Returns portal session for the signed-in user, or null if they have no portal access. */
export async function getPortalSession(): Promise<PortalSession | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("client_portal_access")
    .select("*, client:clients(*)")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data || !data.client) return null

  return {
    userId: user.id,
    userEmail: user.email,
    access: data as PortalAccess,
  }
}

/** Returns true if the user is an organization staff member (any role). */
export async function isStaffMember(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { count } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  return (count ?? 0) > 0
}
