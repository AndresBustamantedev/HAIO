"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import {
  MILESTONE_WORK_STATUSES,
  MILESTONE_BILLING_STATUSES,
} from "@/features/billing-milestones/schemas/milestone-schema"

type Result = { error: string | null }

export async function updateMilestoneWorkStatus(
  milestoneId: string,
  projectId: string,
  workStatus: string,
): Promise<Result> {
  if (!(MILESTONE_WORK_STATUSES as readonly string[]).includes(workStatus)) {
    return { error: "Estado de trabajo no válido." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({ work_status: workStatus, updated_by: user?.id ?? null })
    .eq("id", milestoneId)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}

export async function updateMilestoneBillingStatus(
  milestoneId: string,
  projectId: string,
  billingStatus: string,
): Promise<Result> {
  if (!(MILESTONE_BILLING_STATUSES as readonly string[]).includes(billingStatus)) {
    return { error: "Estado de facturación no válido." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({ billing_status: billingStatus, updated_by: user?.id ?? null })
    .eq("id", milestoneId)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
