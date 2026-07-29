"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — documents.deleted_at. The Storage object is left in place (audit trail). */
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) {
    return { error: "No se pudo eliminar el documento. " + error.message }
  }

  revalidatePath("/documentos")

  return { error: null }
}
