"use server"

import { revalidatePath } from "next/cache"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { generateInvoiceFromMilestone } from "@/features/billing-milestones/actions/generate-invoice-from-milestone"
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/features/projects/schemas/project-schema"

export type WizardMilestone = {
  name: string
  amount: number
  currency_code: string
  billing_trigger: "manual" | "project_created" | "scheduled_date" | "milestone_completed" | "client_approved"
  planned_date?: string
  tax_rate?: number
}

export type ProjectWizardInput = {
  client_id: string
  name: string
  type: string
  status: string
  description?: string
  start_date?: string
  target_date?: string
  budget?: number
  currency_code: string
  tax_rate?: number
  payment_method?: string
}

type Result = { error: string | null; projectId?: string; autoInvoiceError?: string }

export async function createProjectWithPlan(
  projectData: ProjectWizardInput,
  milestones: WizardMilestone[],
): Promise<Result> {
  if (!PROJECT_TYPES.includes(projectData.type as never)) {
    return { error: "Tipo de proyecto no válido." }
  }
  if (!PROJECT_STATUSES.includes(projectData.status as never)) {
    return { error: "Estado no válido." }
  }
  if (!projectData.name.trim()) {
    return { error: "El nombre del proyecto es obligatorio." }
  }
  if (!projectData.client_id) {
    return { error: "Debes seleccionar un cliente." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const metadata: Record<string, unknown> = {}
  if (projectData.tax_rate != null && projectData.tax_rate > 0) {
    metadata.default_tax_rate = projectData.tax_rate
  }
  if (projectData.payment_method) {
    metadata.payment_method = projectData.payment_method
  }

  type ProjectType = (typeof PROJECT_TYPES)[number]
  type ProjectStatus = (typeof PROJECT_STATUSES)[number]

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .insert({
      organization_id: organization.organizationId,
      client_id: projectData.client_id,
      name: projectData.name.trim(),
      slug: slugify(projectData.name),
      type: projectData.type as ProjectType,
      status: projectData.status as ProjectStatus,
      description: projectData.description?.trim() || null,
      budget: projectData.budget ?? null,
      currency_code: projectData.currency_code,
      start_date: projectData.start_date || null,
      target_date: projectData.target_date || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: Object.keys(metadata).length ? metadata as any : undefined,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (projectError) {
    return { error: "No se pudo crear el proyecto. " + projectError.message }
  }

  const projectId = projectRow.id
  let autoInvoiceError: string | undefined

  for (const m of milestones) {
    const { data: msRow, error: msError } = await (supabase as any)
      .from("project_milestones")
      .insert({
        project_id: projectId,
        client_id: projectData.client_id,
        organization_id: organization.organizationId,
        name: m.name,
        type: "development",
        work_status: "planned",
        billing_status: "unbilled",
        billing_trigger: m.billing_trigger,
        amount: m.amount,
        currency_code: m.currency_code,
        tax_rate: m.tax_rate ?? null,
        planned_date: m.planned_date || null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single()

    if (msError || !msRow) continue

    if (m.billing_trigger === "project_created") {
      const invoiceResult = await generateInvoiceFromMilestone(
        msRow.id,
        projectId,
        projectData.client_id,
      )
      if (invoiceResult?.error && !autoInvoiceError) {
        autoInvoiceError = invoiceResult.error
      }
    }
  }

  revalidatePath("/proyectos")
  revalidatePath("/dashboard")
  revalidatePath(`/clientes/${projectData.client_id}`)

  return { error: null, projectId, autoInvoiceError }
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}
