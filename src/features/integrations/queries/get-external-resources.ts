import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ExternalResource } from '@/features/integrations/types'

export type GetExternalResourcesParams = {
  organizationId: string
  integrationId: string
  resourceType?: string
  assigned?: boolean
  page?: number
  pageSize?: number
}

export type GetExternalResourcesResult = {
  resources: ExternalResource[]
  total: number
  page: number
  pageSize: number
}

export async function getExternalResources(
  params: GetExternalResourcesParams,
): Promise<GetExternalResourcesResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('external_resources')
    .select('*', { count: 'exact' })
    .eq('organization_id', params.organizationId)
    .eq('integration_id', params.integrationId)
    .order('external_display_name', { ascending: true })
    .range(from, to)

  if (params.resourceType) {
    query = query.eq('external_resource_type', params.resourceType)
  }

  if (params.assigned === true) {
    query = query.not('client_id', 'is', null)
  } else if (params.assigned === false) {
    query = query.is('client_id', null)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    resources: (data ?? []) as ExternalResource[],
    total: count ?? 0,
    page,
    pageSize,
  }
}
