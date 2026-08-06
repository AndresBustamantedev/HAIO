"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

type Input = {
  name: string
  description?: string
  due_date?: string
  external_url?: string
}

export async function updateDeliverable(
  deliverableId: string,
  milestoneId: string,
  projectId: string,
  data: Input,
): Promise<{ error: string | null }> {
  if (!data.name?.trim()) return { error: "El nombre es obligatorio." }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("milestone_deliverables")
    .update({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      due_date: data.due_date || null,
      external_url: data.external_url?.trim() || null,
    })
    .eq("id", deliverableId)
    .eq("milestone_id", milestoneId)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: error.message }

  await logMilestoneActivity(
    milestoneId, user?.id ?? null,
    "deliverable_updated",
    `Entregable actualizado: "${data.name.trim()}"`,
  )

  revalidatePath(`/proyectos/${projectId}/hitos/${milestoneId}`)
  return { error: null }
}
