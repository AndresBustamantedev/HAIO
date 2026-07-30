'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import {
  updateIntegrationSettingsSchema,
  type UpdateIntegrationSettingsInput,
} from '@/features/integrations/schemas/integration-schema'

type ActionResult = { error: string | null }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

export async function updateIntegration(
  integrationId: string,
  input: UpdateIntegrationSettingsInput,
): Promise<ActionResult> {
  const parsed = updateIntegrationSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para editar integraciones.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('integrations')
    .select('id')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!existing) return { error: 'Integración no encontrada.' }

  const { error } = await db
    .from('integrations')
    .update({
      name: parsed.data.name,
      sync_frequency: parsed.data.sync_frequency,
      sync_enabled: parsed.data.sync_enabled,
    })
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo actualizar la integración.' }

  revalidatePath('/integraciones')
  revalidatePath(`/integraciones/${integrationId}`)

  return { error: null }
}
