"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

export async function updateMilestoneNotes(
  milestoneId: string,
  projectId: string,
  internalNotes: string | null,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({ internal_notes: internalNotes || null })
    .eq("id", milestoneId)
    .eq("project_id", projectId)

  if (error) return { error: error.message }

  await logMilestoneActivity(milestoneId, user?.id ?? null, "notes_updated", "Notas internas actualizadas")

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
