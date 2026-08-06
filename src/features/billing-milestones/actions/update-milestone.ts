"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { milestoneSchema, type MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"
import { logMilestoneActivity } from "@/features/billing-milestones/utils/log-milestone-activity"

type ActionResult = { error: string | null }

export async function updateMilestone(
  id: string,
  projectId: string,
  input: MilestoneInput,
): Promise<ActionResult> {
  const parsed = milestoneSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await (supabase as any)
    .from("project_milestones")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      client_description: parsed.data.client_description || null,
      type: parsed.data.type,
      work_status: parsed.data.work_status,
      billing_status: parsed.data.billing_status,
      billing_trigger: parsed.data.billing_trigger || "manual",
      amount: Number(parsed.data.amount),
      currency_code: parsed.data.currency_code,
      tax_rate: parsed.data.tax_rate ? Number(parsed.data.tax_rate) : null,
      internal_cost: parsed.data.internal_cost ? Number(parsed.data.internal_cost) : null,
      billing_interval: parsed.data.billing_interval || null,
      planned_date: parsed.data.planned_date || null,
      planned_invoice_date: parsed.data.planned_invoice_date || null,
      billed_at: parsed.data.billed_at || null,
      notes: parsed.data.notes || null,
      internal_notes: parsed.data.internal_notes || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo actualizar el hito. " + error.message }
  }

  await logMilestoneActivity(id, user?.id ?? null, "milestone_updated", `Hito actualizado: "${parsed.data.name}"`)

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
