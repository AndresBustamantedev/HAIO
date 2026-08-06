import "server-only"
import { createClient } from "@/lib/supabase/server"

export type ProjectSubscription = {
  id: string
  client_id: string
  service_id: string
  project_id: string | null
  status: "trialing" | "active" | "past_due" | "paused" | "cancelled" | "expired"
  billing_interval: string
  amount: number
  current_period_start: string | null
  current_period_end: string | null
  cancel_at: string | null
  services: { name: string } | null
}

export async function getProjectSubscriptions(projectId: string): Promise<ProjectSubscription[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("subscriptions")
    .select("id, client_id, service_id, project_id, status, billing_interval, amount, current_period_start, current_period_end, cancel_at, services(name)")
    .eq("project_id", projectId)
    .not("status", "in", '("cancelled","expired")')
    .order("current_period_end", { ascending: true, nullsFirst: false })

  return (data as ProjectSubscription[]) ?? []
}
