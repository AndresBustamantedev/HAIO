"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — hosting_accounts.deleted_at, never a physical DELETE. */
export async function deleteHosting(hostingId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("hosting_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", hostingId)

  if (error) {
    return { error: "No se pudo eliminar el hosting. " + error.message }
  }

  revalidatePath("/hosting")

  return { error: null }
}
