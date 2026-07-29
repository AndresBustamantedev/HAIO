"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — domains.deleted_at, never a physical DELETE. */
export async function deleteDomain(domainId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("domains")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", domainId)

  if (error) {
    return { error: "No se pudo eliminar el dominio. " + error.message }
  }

  revalidatePath("/dominios")

  return { error: null }
}
