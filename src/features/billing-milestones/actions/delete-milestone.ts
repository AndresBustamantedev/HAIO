"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function deleteMilestone(id: string, projectId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo eliminar el hito. " + error.message }
  }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
