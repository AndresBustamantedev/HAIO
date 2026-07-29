"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — tasks.deleted_at, never a physical DELETE. */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)

  if (error) {
    return { error: "No se pudo eliminar la tarea. " + error.message }
  }

  revalidatePath("/tareas")
  revalidatePath("/dashboard")

  return { error: null }
}
