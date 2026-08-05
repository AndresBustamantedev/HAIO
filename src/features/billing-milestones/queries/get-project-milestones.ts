import { createClient } from "@/lib/supabase/server"

export type ProjectMilestone = {
  id: string
  name: string
  type: "development" | "maintenance" | "extra" | "renewal" | "other"
  work_status: "draft" | "planned" | "in_progress" | "in_review" | "completed" | "cancelled"
  billing_status: "unbilled" | "invoice_draft" | "invoiced" | "partially_paid" | "paid" | "credited" | "cancelled"
  billing_trigger: string
  amount: number
  currency_code: string
  internal_cost: number | null
  billing_interval: string | null
  planned_date: string | null
  billed_at: string | null
  notes: string | null
  internal_notes: string | null
  sort_order: number
  created_at: string
  invoice_id: string | null
  invoice_number: string | null
  invoice_status: string | null
}

export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from("project_milestones")
    .select(`
      id, name, type, work_status, billing_status, billing_trigger,
      amount, currency_code, internal_cost, billing_interval,
      planned_date, billed_at, notes, internal_notes, sort_order, created_at,
      invoice_milestone_links(invoice_id, invoices(invoice_number, status))
    `)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  return ((data ?? []) as any[]).map((m) => {
    const link = (m.invoice_milestone_links as any[])?.[0]
    return {
      ...m,
      invoice_id: link?.invoice_id ?? null,
      invoice_number: link?.invoices?.invoice_number ?? null,
      invoice_status: link?.invoices?.status ?? null,
      invoice_milestone_links: undefined,
    }
  }) as ProjectMilestone[]
}
