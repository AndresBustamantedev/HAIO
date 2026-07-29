"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — credentials.deleted_at, never a physical DELETE. */
export async function deleteCredential(credentialId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("credentials")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", credentialId)

  if (error) {
    return { error: "No se pudo eliminar la credencial. " + error.message }
  }

  revalidatePath("/credenciales")

  return { error: null }
}
