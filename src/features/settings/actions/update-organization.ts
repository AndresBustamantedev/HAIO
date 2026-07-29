"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { organizationSchema, type OrganizationInput } from "@/features/settings/schemas/organization-schema"

type ActionResult = { error: string | null }

/** RLS restricts this update to owner/admin/manager roles — see 0010_rls_policies.sql. */
export async function updateOrganization(input: OrganizationInput): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legal_name || null,
      tax_id: parsed.data.tax_id || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      address_line_1: parsed.data.address_line_1 || null,
      city: parsed.data.city || null,
      postal_code: parsed.data.postal_code || null,
      country_code: parsed.data.country_code,
      currency_code: parsed.data.currency_code,
      timezone: parsed.data.timezone,
    })
    .eq("id", organization.organizationId)

  if (error) {
    return { error: "No se pudo actualizar la organización. " + error.message }
  }

  revalidatePath("/configuracion")
  revalidatePath("/dashboard")

  return { error: null }
}
