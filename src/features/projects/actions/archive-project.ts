"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Sets status="archived" without soft-deleting — used for the "Archivar" row action. */
export async function archiveProject(projectId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", projectId)

  if (error) {
    return { error: "No se pudo archivar el proyecto. " + error.message }
  }

  revalidatePath("/proyectos")
  revalidatePath(`/proyectos/${projectId}`)

  return { error: null }
}
