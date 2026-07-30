import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Integration } from '@/features/integrations/types'

export type GetIntegrationResult = {
  integration: Integration
}

/** Obtiene una integración por ID validando que pertenezca a la organización. */
export async function getIntegration(
  integrationId: string,
  organizationId: string,
): Promise<GetIntegrationResult | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data, error } = await db
    .from('v_integrations_safe')
    .select('*')
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return { integration: data as Integration }
}
