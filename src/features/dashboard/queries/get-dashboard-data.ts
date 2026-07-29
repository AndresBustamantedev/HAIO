import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

export type DashboardMetrics = Database["public"]["Views"]["v_dashboard_metrics"]["Row"]
export type UpcomingRenewal = Database["public"]["Views"]["v_upcoming_renewals"]["Row"]
export type InvoiceBalance = Database["public"]["Views"]["v_invoice_balances"]["Row"]
export type RecentClient = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "display_name" | "status" | "created_at"
>
export type PendingTask = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  "id" | "title" | "status" | "priority" | "due_date"
>

export type DashboardData = {
  metrics: DashboardMetrics | null
  upcomingRenewals: UpcomingRenewal[]
  pendingInvoices: InvoiceBalance[]
  recentClients: RecentClient[]
  pendingTasks: PendingTask[]
}

/**
 * All dashboard reads for the current organization, run in parallel. Every
 * query relies on RLS (the user's session) to scope results — organizationId
 * is only used to filter, never to bypass access control.
 */
export async function getDashboardData(organizationId: string): Promise<DashboardData> {
  const supabase = await createClient()

  const [metricsRes, renewalsRes, invoicesRes, clientsRes, tasksRes] = await Promise.all([
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
      .from("clients")
      .select("id, display_name, status, created_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("status", "in", "(done,cancelled)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
  ])

  return {
    metrics: metricsRes.data ?? null,
    upcomingRenewals: renewalsRes.data ?? [],
    pendingInvoices: invoicesRes.data ?? [],
    recentClients: clientsRes.data ?? [],
    pendingTasks: tasksRes.data ?? [],
  }
}
