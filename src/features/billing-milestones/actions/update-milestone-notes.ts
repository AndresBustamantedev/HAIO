"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateMilestoneNotes(
  milestoneId: string,
  projectId: string,
  internalNotes: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({ internal_notes: internalNotes || null })
    .eq("id", milestoneId)
    .eq("project_id", projectId)

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
