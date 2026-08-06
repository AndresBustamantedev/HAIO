"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import {
  MILESTONE_WORK_STATUSES,
  MILESTONE_BILLING_STATUSES,
} from "@/features/billing-milestones/schemas/milestone-schema"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

const WORK_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", planned: "Planificado", in_progress: "En progreso",
  in_review: "En revisión", completed: "Completado", cancelled: "Cancelado",
}
const BILLING_STATUS_LABEL: Record<string, string> = {
  unbilled: "Sin facturar", invoice_draft: "Borrador", invoiced: "Facturado",
  partially_paid: "Pago parcial", paid: "Cobrado", credited: "Abonado", cancelled: "Cancelado",
}

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

  await logMilestoneActivity(
    milestoneId, user?.id ?? null,
    "work_status_changed",
    `Estado de trabajo cambiado a "${WORK_STATUS_LABEL[workStatus] ?? workStatus}"`,
  )

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

  await logMilestoneActivity(
    milestoneId, user?.id ?? null,
    "billing_status_changed",
    `Estado de facturación cambiado a "${BILLING_STATUS_LABEL[billingStatus] ?? billingStatus}"`,
  )

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
