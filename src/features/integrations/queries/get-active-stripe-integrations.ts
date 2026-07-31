import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

export type StripeIntegrationOption = {
  id: string
  display_name: string | null
}

/** Devuelve las integraciones Stripe conectadas de la organización actual. */
export async function getActiveStripeIntegrations(): Promise<StripeIntegrationOption[]> {
  const organization = await getCurrentOrganization()
  if (!organization) return []

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data } = await db
    .from('integrations')
    .select('id, display_name')
    .eq('organization_id', organization.organizationId)
    .eq('connector_type', 'stripe')
    .eq('status', 'connected')
    .is('deleted_at', null)
    .order('display_name')

  return (data ?? []) as StripeIntegrationOption[]
}
