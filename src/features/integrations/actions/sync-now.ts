'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { runSync } from '@/features/integrations/services/sync-engine'

type ActionResult = {
  error: string | null
  syncRunId?: string
  resourcesFound?: number
  resourcesCreated?: number
  resourcesUpdated?: number
}

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

export async function syncIntegrationNow(
  integrationId: string,
): Promise<ActionResult> {
  // 1. Verificar sesión y rol
  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: 'No perteneces a ninguna organización.' }
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para iniciar sincronizaciones.' }
  }

  // 2. Verificar que la integración pertenece a la organización y está activa
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('integrations')
    .select('id, status')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!existing) {
    return { error: 'Integración no encontrada.' }
  }

  if (existing.status === 'disabled') {
    return { error: 'Esta integración está desactivada.' }
  }

  // 3. Ejecutar sync via SyncEngine (admin client para operaciones internas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = createAdminClient() as any

  try {
    const result = await runSync({
      integrationId,
      organizationId: organization.organizationId,
      triggerType: 'manual',
      supabaseAdmin,
    })

    revalidatePath('/integraciones')

    if (result.status === 'failed') {
      return {
        error: result.errors[0] ?? 'La sincronización falló.',
        syncRunId: result.syncRunId,
      }
    }

    return {
      error: null,
      syncRunId: result.syncRunId,
      resourcesFound: result.resourcesFound,
      resourcesCreated: result.resourcesCreated,
      resourcesUpdated: result.resourcesUpdated,
    }
  } catch {
    return { error: 'Error interno al iniciar la sincronización.' }
  }
}
