"use server"

import { getMilestoneDetail } from "@/features/billing-milestones/queries/get-milestone-detail"
import type { MilestoneDetail } from "@/features/billing-milestones/queries/get-milestone-detail"

export async function getMilestoneDetailAction(
  milestoneId: string,
  projectId: string,
): Promise<MilestoneDetail | null> {
  return getMilestoneDetail(milestoneId, projectId)
}
