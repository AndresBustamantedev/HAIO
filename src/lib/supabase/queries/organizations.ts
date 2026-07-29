import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

type OrganizationRole = Database["public"]["Enums"]["organization_role"]

export type CurrentOrganization = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: OrganizationRole
}

/**
 * Resolves the "active organization" for the signed-in user: their first
 * active membership. HAIO's schema supports multiple organizations per user
 * (organization_members), but this phase does not yet build an organization
 * switcher — every query in the app should go through this helper so that
 * adding a switcher later only means changing this one function.
 *
 * Returns null when there is no session or no membership yet.
 */
export async function getCurrentOrganization(): Promise<CurrentOrganization | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.organizations) {
    return null
  }

  return {
    organizationId: data.organization_id,
    organizationName: data.organizations.name,
    organizationSlug: data.organizations.slug,
    role: data.role,
  }
}
