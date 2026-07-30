import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { InfrastructureAlert } from '@/features/integrations/types'

export type GetAlertsParams = {
  organizationId: string
  integrationId?: string
  status?: string
  severity?: string
  page?: number
  pageSize?: number
}

export type GetAlertsResult = {
  alerts: InfrastructureAlert[]
  total: number
  page: number
  pageSize: number
}

export async function getInfrastructureAlerts(
  params: GetAlertsParams,
): Promise<GetAlertsResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 50

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = db
    .from('infrastructure_alerts')
    .select('*', { count: 'exact' })
    .eq('organization_id', params.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.integrationId) {
    query = query.eq('integration_id', params.integrationId)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  } else {
    // Por defecto, solo alertas activas
    query = query.not('status', 'in', '("resolved","ignored")')
  }

  if (params.severity) {
    query = query.eq('severity', params.severity)
  }

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    alerts: (data ?? []) as InfrastructureAlert[],
    total: count ?? 0,
    page,
    pageSize,
  }
}
