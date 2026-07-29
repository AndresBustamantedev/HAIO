"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { contactSchema, type ContactInput } from "@/features/contacts/schemas/contact-schema"

type ActionResult = { error: string | null }

export async function createContact(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("client_contacts").insert({
    organization_id: organization.organizationId,
    client_id: parsed.data.client_id,
    full_name: parsed.data.full_name,
    job_title: parsed.data.job_title || null,
    department: parsed.data.department || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    mobile: parsed.data.mobile || null,
    is_primary: parsed.data.is_primary,
    receives_billing: parsed.data.receives_billing,
    receives_support: parsed.data.receives_support,
    notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: "No se pudo crear el contacto. " + error.message }
  }

  revalidatePath("/contactos")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
