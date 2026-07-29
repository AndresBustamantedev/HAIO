import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { TaskWithRelations } from "@/features/tasks/types"

export type GetTasksParams = {
  organizationId: string
  search?: string
  status?: string
  priority?: string
  projectId?: string
  page?: number
  pageSize?: number
}

export type GetTasksResult = {
  tasks: TaskWithRelations[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered task list — all resolved server-side. */
export async function getTasks(params: GetTasksParams): Promise<GetTasksResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("tasks")
    .select("*, clients(id, display_name), projects(id, name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("title", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as TaskWithRelations["status"])
  }

  if (params.priority) {
    query = query.eq("priority", params.priority as TaskWithRelations["priority"])
  }

  if (params.projectId) {
    query = query.eq("project_id", params.projectId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order("due_date", { ascending: true, nullsFirst: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    tasks: (data as TaskWithRelations[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
