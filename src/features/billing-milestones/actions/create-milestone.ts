"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { milestoneSchema, type MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"

type ActionResult = { error: string | null }

export async function createMilestone(
  projectId: string,
  clientId: string,
  organizationId: string,
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
    .insert({
      project_id: projectId,
      client_id: clientId,
      organization_id: organizationId,
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
      created_by: user?.id ?? null,
    })

  if (error) {
    return { error: "No se pudo crear el hito. " + error.message }
  }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
