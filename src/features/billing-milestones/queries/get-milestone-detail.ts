import { createClient } from "@/lib/supabase/server"

export type MilestoneDeliverable = {
  id: string
  name: string
  description: string | null
  status: "pending" | "in_progress" | "done"
  due_date: string | null
  completed_at: string | null
  external_url: string | null
  sort_order: number
  created_at: string
}

export type MilestoneExpense = {
  id: string
  description: string
  amount: number
  currency_code: string
  category: string
  incurred_at: string
  notes: string | null
}

export type MilestoneDetail = {
  id: string
  name: string
  description: string | null
  client_description: string | null
  type: string
  work_status: string
  billing_status: string
  billing_trigger: string | null
  amount: number
  currency_code: string
  tax_rate: number | null
  internal_cost: number | null
  estimated_cost: number | null
  actual_cost: number | null
  estimated_hours: number | null
  actual_hours: number | null
  assigned_to: string | null
  billing_interval: string | null
  planned_date: string | null
  planned_invoice_date: string | null
  billed_at: string | null
  completed_at: string | null
  notes: string | null
  internal_notes: string | null
  sort_order: number
  project_id: string
  organization_id: string
  created_at: string
  updated_at: string | null
  invoice_id: string | null
  invoice_number: string | null
  invoice_status: string | null
  deliverables: MilestoneDeliverable[]
  expenses: MilestoneExpense[]
}

export async function getMilestoneDetail(
  milestoneId: string,
  projectId: string,
): Promise<MilestoneDetail | null> {
  const supabase = await createClient()

  const [milestoneRes, deliverablesRes, expensesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("project_milestones")
      .select(`
        id, name, description, client_description, type,
        work_status, billing_status, billing_trigger,
        amount, currency_code, tax_rate, internal_cost,
        estimated_cost, actual_cost, estimated_hours, actual_hours, assigned_to,
        billing_interval, planned_date, planned_invoice_date, billed_at, completed_at,
        notes, internal_notes, sort_order,
        project_id, organization_id, created_at, updated_at,
        invoice_milestone_links(invoice_id, invoices(invoice_number, status))
      `)
      .eq("id", milestoneId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("milestone_deliverables")
      .select("id, name, description, status, due_date, completed_at, external_url, sort_order, created_at")
      .eq("milestone_id", milestoneId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("project_expenses")
      .select("id, description, amount, currency_code, category, incurred_at, notes")
      .eq("milestone_id", milestoneId)
      .is("deleted_at", null)
      .order("incurred_at", { ascending: false }),
  ])

  if (!milestoneRes.data) return null

  const m = milestoneRes.data
  const link = (m.invoice_milestone_links as any[])?.[0]

  return {
    id: m.id,
    name: m.name,
    description: m.description ?? null,
    client_description: m.client_description ?? null,
    type: m.type,
    work_status: m.work_status,
    billing_status: m.billing_status,
    billing_trigger: m.billing_trigger ?? null,
    amount: Number(m.amount),
    currency_code: m.currency_code,
    tax_rate: m.tax_rate != null ? Number(m.tax_rate) : null,
    internal_cost: m.internal_cost != null ? Number(m.internal_cost) : null,
    estimated_cost: m.estimated_cost != null ? Number(m.estimated_cost) : null,
    actual_cost: m.actual_cost != null ? Number(m.actual_cost) : null,
    estimated_hours: m.estimated_hours != null ? Number(m.estimated_hours) : null,
    actual_hours: m.actual_hours != null ? Number(m.actual_hours) : null,
    assigned_to: m.assigned_to ?? null,
    billing_interval: m.billing_interval ?? null,
    planned_date: m.planned_date ?? null,
    planned_invoice_date: m.planned_invoice_date ?? null,
    billed_at: m.billed_at ?? null,
    completed_at: m.completed_at ?? null,
    notes: m.notes ?? null,
    internal_notes: m.internal_notes ?? null,
    sort_order: m.sort_order,
    project_id: m.project_id,
    organization_id: m.organization_id,
    created_at: m.created_at,
    updated_at: m.updated_at ?? null,
    invoice_id: link?.invoice_id ?? null,
    invoice_number: (link?.invoices as any)?.invoice_number ?? null,
    invoice_status: (link?.invoices as any)?.status ?? null,
    deliverables: (deliverablesRes.data ?? []) as MilestoneDeliverable[],
    expenses: (expensesRes.data ?? []) as MilestoneExpense[],
  }
}
