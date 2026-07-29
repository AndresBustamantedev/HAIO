"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — clients.deleted_at, never a physical DELETE. */
export async function deleteClient(clientId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)

  if (error) {
    return { error: "No se pudo eliminar el cliente. " + error.message }
  }

  revalidatePath("/clientes")
  revalidatePath("/dashboard")

  return { error: null }
}
