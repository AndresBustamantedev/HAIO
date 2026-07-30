import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runSync } from '@/features/integrations/services/sync-engine'

/**
 * GET /api/cron/sync
 *
 * Invocado por Vercel Cron o Supabase Cron.
 * Itera sobre las integraciones con sync_enabled=true y ejecuta el SyncEngine.
 *
 * Seguridad:
 * - Valida CRON_SECRET en el header Authorization.
 * - Solo usa el admin client internamente.
 * - Nunca revela detalles de errores en la respuesta HTTP.
 */

const FREQUENCY_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily:  24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/sync] CRON_SECRET no está configurado.')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = createAdminClient() as any

  // Integraciones activas con sincronización automática habilitada
  const { data: integrations, error } = await supabaseAdmin
    .from('integrations')
    .select('id, organization_id, connector_type, sync_frequency, last_successful_sync_at')
    .eq('sync_enabled', true)
    .in('status', ['connected', 'disconnected', 'degraded'])
    .is('deleted_at', null)

  if (error) {
    console.error('[cron/sync] Error al cargar integraciones:', error.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  const now = Date.now()
  const results: Array<{ integrationId: string; status: string }> = []

  for (const integration of integrations ?? []) {
    const lastSync = integration.last_successful_sync_at
      ? new Date(integration.last_successful_sync_at as string).getTime()
      : 0

    const freq = integration.sync_frequency as string
    const frequencyMs = FREQUENCY_MS[freq] ?? FREQUENCY_MS.daily

    if (now - lastSync < frequencyMs) {
      results.push({ integrationId: integration.id as string, status: 'skipped' })
      continue
    }

    try {
      const result = await runSync({
        integrationId: integration.id as string,
        organizationId: integration.organization_id as string,
        triggerType: 'scheduled',
        supabaseAdmin,
      })
      results.push({ integrationId: integration.id as string, status: result.status })
    } catch (err) {
      console.error(
        `[cron/sync] Error en integración ${integration.id}:`,
        err instanceof Error ? err.message : 'unknown',
      )
      results.push({ integrationId: integration.id as string, status: 'error' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
