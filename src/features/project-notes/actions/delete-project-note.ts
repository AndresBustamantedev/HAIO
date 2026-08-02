"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Result = { error: string | null }

export async function deleteProjectNote(noteId: string, projectId: string): Promise<Result> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("project_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .is("deleted_at", null)

  if (error) return { error: "No se pudo eliminar la nota. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
