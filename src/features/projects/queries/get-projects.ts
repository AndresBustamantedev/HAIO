import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { ProjectWithClient } from "@/features/projects/types"

const SORTABLE_COLUMNS = ["name", "created_at", "status", "target_date"] as const
type SortableColumn = (typeof SORTABLE_COLUMNS)[number]

export type GetProjectsParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
  sort?: string
  dir?: "asc" | "desc"
}

export type GetProjectsResult = {
  projects: ProjectWithClient[]
  total: number
  page: number
  pageSize: number
}

function isSortable(value: string | undefined): value is SortableColumn {
  return !!value && (SORTABLE_COLUMNS as readonly string[]).includes(value)
}

/** Paginated, filtered, sorted project list — all resolved server-side. */
export async function getProjects(params: GetProjectsParams): Promise<GetProjectsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20
  const sortColumn = isSortable(params.sort) ? params.sort : "created_at"
  const ascending = params.dir === "asc"

  let query = supabase
    .from("projects")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("name", `%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as ProjectWithClient["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order(sortColumn, { ascending })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    projects: (data as ProjectWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
