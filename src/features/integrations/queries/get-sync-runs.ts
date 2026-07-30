import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { IntegrationSyncRun } from '@/features/integrations/types'

export type GetSyncRunsParams = {
  organizationId: string
  integrationId: string
  page?: number
  pageSize?: number
}

export type GetSyncRunsResult = {
  runs: IntegrationSyncRun[]
  total: number
  page: number
  pageSize: number
}

export async function getSyncRuns(params: GetSyncRunsParams): Promise<GetSyncRunsResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 25

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await db
    .from('integration_sync_runs')
    .select('*', { count: 'exact' })
    .eq('organization_id', params.organizationId)
    .eq('integration_id', params.integrationId)
    .order('started_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    runs: (data ?? []) as IntegrationSyncRun[],
    total: count ?? 0,
    page,
    pageSize,
  }
}
