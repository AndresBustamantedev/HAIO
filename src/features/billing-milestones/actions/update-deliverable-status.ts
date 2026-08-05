"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type DeliverableStatus = "pending" | "in_progress" | "done"

export async function updateDeliverableStatus(
  deliverableId: string,
  milestoneId: string,
  projectId: string,
  status: DeliverableStatus,
): Promise<{ error: string | null }> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

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

  revalidatePath(`/proyectos/${projectId}/hitos/${milestoneId}`)
  return { error: null }
}
