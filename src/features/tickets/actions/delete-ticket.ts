"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — tickets.deleted_at, never a physical DELETE. */
export async function deleteTicket(ticketId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("tickets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ticketId)

  if (error) {
    return { error: "No se pudo eliminar el ticket. " + error.message }
  }

  revalidatePath("/tickets")

  return { error: null }
}
