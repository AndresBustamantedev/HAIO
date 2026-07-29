"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — projects.deleted_at, never a physical DELETE. */
export async function deleteProject(projectId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)

  if (error) {
    return { error: "No se pudo eliminar el proyecto. " + error.message }
  }

  revalidatePath("/proyectos")
  revalidatePath("/dashboard")

  return { error: null }
}
