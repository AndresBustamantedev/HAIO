import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { BackupConfigWithClient } from "@/features/backups/types"

export type GetBackupConfigsParams = {
  organizationId: string
  search?: string
  status?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetBackupConfigsResult = {
  configs: BackupConfigWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered backup-configuration list — all resolved server-side. */
export async function getBackupConfigs(params: GetBackupConfigsParams): Promise<GetBackupConfigsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("backup_configurations")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`name.ilike.%${term}%,provider_name.ilike.%${term}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status as BackupConfigWithClient["status"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("next_run_at", { ascending: true, nullsFirst: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    configs: (data as BackupConfigWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
