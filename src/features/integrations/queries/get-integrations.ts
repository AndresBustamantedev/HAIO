import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Integration } from '@/features/integrations/types'

export type GetIntegrationsParams = {
  organizationId: string
  status?: string
}

export type GetIntegrationsResult = {
  integrations: Integration[]
}

/** Lista de integraciones desde la vista segura (sin secret_ciphertext). */
export async function getIntegrations(
  params: GetIntegrationsParams,
): Promise<GetIntegrationsResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  let query = db
    .from('v_integrations_safe')
    .select('*')
    .eq('organization_id', params.organizationId)
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return { integrations: (data ?? []) as Integration[] }
}
