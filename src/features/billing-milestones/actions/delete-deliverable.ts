"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

export async function deleteDeliverable(
  deliverableId: string,
  milestoneId: string,
  projectId: string,
  name?: string,
): Promise<{ error: string | null }> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("milestone_deliverables")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", deliverableId)
    .eq("milestone_id", milestoneId)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: error.message }

  const summary = name ? `Entregable eliminado: "${name}"` : "Entregable eliminado"
  await logMilestoneActivity(milestoneId, user?.id ?? null, "deliverable_deleted", summary)

  revalidatePath(`/proyectos/${projectId}/hitos/${milestoneId}`)
  return { error: null }
}
