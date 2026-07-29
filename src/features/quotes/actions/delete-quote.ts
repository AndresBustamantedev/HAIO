"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — quotes.deleted_at, never a physical DELETE. */
export async function deleteQuote(quoteId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("quotes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", quoteId)

  if (error) {
    return { error: "No se pudo eliminar el presupuesto. " + error.message }
  }

  revalidatePath("/presupuestos")

  return { error: null }
}
