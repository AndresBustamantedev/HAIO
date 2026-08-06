"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

type DeliverableStatus = "pending" | "in_progress" | "done"

const DEL_STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending: "Pendiente", in_progress: "En progreso", done: "Completado",
}

export async function updateDeliverableStatus(
  deliverableId: string,
  milestoneId: string,
  projectId: string,
  status: DeliverableStatus,
  name?: string,
): Promise<{ error: string | null }> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("milestone_deliverables")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", deliverableId)
    .eq("milestone_id", milestoneId)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: error.message }

  const label = DEL_STATUS_LABEL[status]
  const summary = name
    ? `Entregable "${name}" marcado como ${label}`
    : `Estado de entregable cambiado a ${label}`

  await logMilestoneActivity(milestoneId, user?.id ?? null, "deliverable_status_changed", summary)

  revalidatePath(`/proyectos/${projectId}/hitos/${milestoneId}`)
  return { error: null }
}
