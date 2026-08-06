import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

export async function logMilestoneActivity(
  milestoneId: string,
  userId: string | null,
  action: string,
  summary: string,
): Promise<void> {
  try {
    const [supabase, org] = await Promise.all([createClient(), getCurrentOrganization()])
    if (!org) return
    await supabase.from("activity_logs").insert({
      organization_id: org.organizationId,
      entity_type: "milestone",
      entity_id: milestoneId,
      action,
      summary,
      user_id: userId ?? null,
    })
  } catch {
    // Never fail the caller due to logging errors
  }
}
