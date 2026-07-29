import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type DashboardMetrics = Database["public"]["Views"]["v_dashboard_metrics"]["Row"]
export type UpcomingRenewal = Database["public"]["Views"]["v_upcoming_renewals"]["Row"]
export type InvoiceBalance = Database["public"]["Views"]["v_invoice_balances"]["Row"]
export type TopClient = Pick<
  Database["public"]["Views"]["v_client_summary"]["Row"],
  "client_id" | "display_name" | "total_invoiced"
>
export type PendingTask = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "status" | "priority" | "due_date"
>
export type RecentActivityItem = Pick<
  Database["public"]["Tables"]["activity_logs"]["Row"],
  "id" | "action" | "entity_type" | "summary" | "created_at"
>

export type MonthlyRevenue = {
  month: number
  revenue: number
}

export type DashboardData = {
  metrics: DashboardMetrics | null
  monthlyRevenueSeries: MonthlyRevenue[]
  currentMonthRevenue: number
  upcomingRenewals: UpcomingRenewal[]
  pendingInvoices: InvoiceBalance[]
  pendingTasks: PendingTask[]
  recentActivity: RecentActivityItem[]
  topClients: TopClient[]
}

export async function getDashboardData(organizationId: string): Promise<DashboardData> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [
    metricsRes,
    renewalsRes,
    invoicesRes,
    yearlyInvoicesRes,
    tasksRes,
    activityRes,
    topClientsRes,
  ] = await Promise.all([
    supabase
      .from("v_dashboard_metrics")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("v_upcoming_renewals")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("expires_on", new Date().toISOString().slice(0, 10))
      .order("expires_on", { ascending: true })
      .limit(5),
    supabase
      .from("v_invoice_balances")
      .select("*")
      .eq("organization_id", organizationId)
      .gt("amount_due", 0)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("invoices")
      .select("issue_date, amount_paid")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .neq("status", "draft")
      .gte("issue_date", `${currentYear}-01-01`)
      .lte("issue_date", `${currentYear}-12-31`),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("status", "in", "(done,cancelled)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("activity_logs")
      .select("id, action, entity_type, summary, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("v_client_summary")
      .select("client_id, display_name, total_invoiced")
      .eq("organization_id", organizationId)
      .order("total_invoiced", { ascending: false })
      .limit(5),
  ])

  // Aggregate yearly invoices into monthly revenue
  const monthlyMap: Record<number, number> = {}
  for (const inv of yearlyInvoicesRes.data ?? []) {
    if (!inv.issue_date) continue
    const month = new Date(inv.issue_date).getMonth() + 1
    monthlyMap[month] = (monthlyMap[month] ?? 0) + (inv.amount_paid ?? 0)
  }
  const monthlyRevenueSeries: MonthlyRevenue[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: monthlyMap[i + 1] ?? 0,
  }))

  const currentMonthRevenue = monthlyMap[currentMonth] ?? 0

  return {
    metrics: metricsRes.data ?? null,
    monthlyRevenueSeries,
    currentMonthRevenue,
    upcomingRenewals: renewalsRes.data ?? [],
    pendingInvoices: invoicesRes.data ?? [],
    pendingTasks: tasksRes.data ?? [],
    recentActivity: (activityRes.data ?? []) as RecentActivityItem[],
    topClients: (topClientsRes.data ?? []) as TopClient[],
  }
}
