"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — client_contacts.deleted_at, never a physical DELETE. */
export async function deleteContact(contactId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("client_contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contactId)

  if (error) {
    return { error: "No se pudo eliminar el contacto. " + error.message }
  }

  revalidatePath("/contactos")

  return { error: null }
}
