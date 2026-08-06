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

export type MilestonePayment = {
  id: string
  amount: number
  currency_code: string
  method: string
  status: string
  paid_at: string | null
  reference: string | null
}

export type MilestoneActivity = {
  id: string
  action: string
  summary: string
  created_at: string
  user_id: string | null
  user_name: string | null
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
  invoice_issue_date: string | null
  invoice_due_date: string | null
  invoice_subtotal: number | null
  invoice_tax_amount: number | null
  invoice_total: number | null
  invoice_amount_due: number | null
  invoice_amount_paid: number | null
  invoice_currency_code: string | null
  deliverables: MilestoneDeliverable[]
  expenses: MilestoneExpense[]
  payments: MilestonePayment[]
  activity: MilestoneActivity[]
}

export async function getMilestoneDetail(
  milestoneId: string,
  projectId: string,
): Promise<MilestoneDetail | null> {
  const supabase = await createClient()

  const [milestoneRes, deliverablesRes, expensesRes, activityRes] = await Promise.all([
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
        invoice_milestone_links(
          invoice_id,
          invoices(
            invoice_number, status, issue_date, due_date,
            subtotal, tax_amount, total, amount_due, amount_paid, currency_code,
            payments(id, amount, currency_code, method, status, paid_at, reference)
          )
        )
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
    supabase
      .from("activity_logs")
      .select("id, action, summary, created_at, user_id")
      .eq("entity_type", "milestone")
      .eq("entity_id", milestoneId)
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  if (!milestoneRes.data) return null

  // Fetch profile names for activity authors
  const activityRows = activityRes.data ?? []
  const userIds = [...new Set(activityRows.map((a: any) => a.user_id).filter(Boolean))] as string[]
  const profileMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name")
      .in("id", userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] =
        p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        "Usuario"
    }
  }

  const m = milestoneRes.data
  const link = (m.invoice_milestone_links as any[])?.[0]
  const invoice = (link?.invoices as any) ?? null
  const payments: MilestonePayment[] = ((invoice?.payments ?? []) as any[]).map((p: any) => ({
    id: p.id,
    amount: Number(p.amount),
    currency_code: p.currency_code,
    method: p.method,
    status: p.status,
    paid_at: p.paid_at ?? null,
    reference: p.reference ?? null,
  }))

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
    invoice_number: invoice?.invoice_number ?? null,
    invoice_status: invoice?.status ?? null,
    invoice_issue_date: invoice?.issue_date ?? null,
    invoice_due_date: invoice?.due_date ?? null,
    invoice_subtotal: invoice?.subtotal != null ? Number(invoice.subtotal) : null,
    invoice_tax_amount: invoice?.tax_amount != null ? Number(invoice.tax_amount) : null,
    invoice_total: invoice?.total != null ? Number(invoice.total) : null,
    invoice_amount_due: invoice?.amount_due != null ? Number(invoice.amount_due) : null,
    invoice_amount_paid: invoice?.amount_paid != null ? Number(invoice.amount_paid) : null,
    invoice_currency_code: invoice?.currency_code ?? null,
    deliverables: (deliverablesRes.data ?? []) as MilestoneDeliverable[],
    expenses: (expensesRes.data ?? []) as MilestoneExpense[],
    payments,
    activity: activityRows.map((a: any) => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      created_at: a.created_at,
      user_id: a.user_id ?? null,
      user_name: a.user_id ? (profileMap[a.user_id] ?? null) : null,
    })),
  }
}
