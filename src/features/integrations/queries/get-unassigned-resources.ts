import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ExternalResource } from '@/features/integrations/types'

export type GetUnassignedResourcesParams = {
  organizationId: string
  resourceType?: string
  page?: number
  pageSize?: number
}

export type GetUnassignedResourcesResult = {
  resources: (ExternalResource & { integration_name: string | null; connector_type: string | null })[]
  total: number
  page: number
  pageSize: number
}

/**
 * Recursos externos sin asignar (local_resource_id IS NULL) en toda la organización.
 * Une con integrations para mostrar el nombre de la integración origen.
 */
export async function getUnassignedResources(
  params: GetUnassignedResourcesParams,
): Promise<GetUnassignedResourcesResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('external_resources')
    .select(
      `*, integrations!inner(name, connector_type)`,
      { count: 'exact' },
    )
    .eq('organization_id', params.organizationId)
    .is('local_resource_id', null)
    .order('external_name', { ascending: true })
    .range(from, to)

  if (params.resourceType) {
    query = query.eq('external_resource_type', params.resourceType)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  const resources = (data ?? []).map((row: Record<string, unknown>) => {
    const integrations = row.integrations as { name: string; connector_type: string } | null
    const { integrations: _i, ...resource } = row
    return {
      ...resource,
      integration_name: integrations?.name ?? null,
      connector_type: integrations?.connector_type ?? null,
    }
  })

  return { resources, total: count ?? 0, page, pageSize }
}
