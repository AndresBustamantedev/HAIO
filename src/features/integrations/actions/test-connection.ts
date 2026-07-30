'use server'

import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { runConnectionTest } from '@/features/integrations/services/sync-engine'

type ActionResult = { error: string | null; success?: boolean; userMessage?: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

export async function testIntegrationConnection(
  integrationId: string,
): Promise<ActionResult> {
  // 1. Verificar sesión y rol
  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: 'No perteneces a ninguna organización.' }
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para probar conexiones.' }
  }

  // 2. Verificar que la integración pertenece a la organización
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('integrations')
    .select('id')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!existing) {
    return { error: 'Integración no encontrada.' }
  }

  // 3. El SyncEngine usa el admin client para descifrar secretos y crear el sync_run.
  //    El admin client se usa solo para el proceso interno — nunca se expone al cliente.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = createAdminClient() as any

  try {
    const result = await runConnectionTest({
      integrationId,
      organizationId: organization.organizationId,
      supabaseAdmin,
    })

    return {
      error: result.success ? null : result.userMessage,
      success: result.success,
      userMessage: result.userMessage,
    }
  } catch {
    return { error: 'Error interno al probar la conexión.' }
  }
}
