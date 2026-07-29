"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import {
  websiteInstallationSchema,
  type WebsiteInstallationInput,
} from "@/features/website-installations/schemas/website-installation-schema"

type ActionResult = { error: string | null }

export async function createWebsiteInstallation(input: WebsiteInstallationInput): Promise<ActionResult> {
  const parsed = websiteInstallationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createClient()
  const d = parsed.data

  const { error } = await supabase.from("website_installations").insert({
    organization_id: organization.organizationId,
    client_id: d.client_id,
    name: d.name,
    cms_type: d.cms_type,
    cms_version: d.cms_version || null,
    environment: d.environment,
    status: d.status,
    public_url: d.public_url || null,
    admin_url: d.admin_url || null,
    hosting_site_id: d.hosting_site_id || null,
    domain_id: d.domain_id || null,
    project_id: d.project_id || null,
    notes: d.notes || null,
  })

  if (error) {
    return { error: "No se pudo crear la instalación. " + error.message }
  }

  revalidatePath("/sitios-web")
  revalidatePath(`/clientes/${d.client_id}`)

  return { error: null }
}
