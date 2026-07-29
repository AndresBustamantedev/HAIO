"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  websiteInstallationSchema,
  type WebsiteInstallationInput,
} from "@/features/website-installations/schemas/website-installation-schema"

type ActionResult = { error: string | null }

export async function updateWebsiteInstallation(id: string, input: WebsiteInstallationInput): Promise<ActionResult> {
  const parsed = websiteInstallationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createClient()
  const d = parsed.data

  const { error } = await supabase
    .from("website_installations")
    .update({
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
    .eq("id", id)

  if (error) {
    return { error: "No se pudo actualizar la instalación. " + error.message }
  }

  revalidatePath("/sitios-web")
  revalidatePath(`/clientes/${d.client_id}`)

  return { error: null }
}
