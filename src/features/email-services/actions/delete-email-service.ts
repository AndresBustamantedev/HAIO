"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — email_services.deleted_at, never a physical DELETE. */
export async function deleteEmailService(emailServiceId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("email_services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", emailServiceId)

  if (error) {
    return { error: "No se pudo eliminar el servicio de correo. " + error.message }
  }

  revalidatePath("/correos")

  return { error: null }
}
