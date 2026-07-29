"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { contactSchema, type ContactInput } from "@/features/contacts/schemas/contact-schema"

type ActionResult = { error: string | null }

export async function updateContact(contactId: string, input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("client_contacts")
    .update({
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
    .eq("id", contactId)

  if (error) {
    return { error: "No se pudo actualizar el contacto. " + error.message }
  }

  revalidatePath("/contactos")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
