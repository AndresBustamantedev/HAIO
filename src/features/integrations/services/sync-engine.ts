/**
 * SyncEngine — Orquesta la sincronización completa de una integración.
 *
 * Completamente desacoplado del runner (puede ser llamado desde):
 *   - Acción manual del usuario
 *   - Vercel Cron (/api/cron/sync)
 *   - Supabase Cron / pg_cron
 *   - Worker independiente
 *   - Script CLI
 *
 * Correspondencia de tipos internos con la DB (migración 0017):
 *   SyncTriggerType 'manual'     → trigger_type 'user'   + operation_type 'manual_sync'
 *   SyncTriggerType 'scheduled'  → trigger_type 'cron'   + operation_type 'scheduled_sync'
 *   SyncTriggerType 'webhook'    → trigger_type 'webhook'+ operation_type 'webhook_sync'
 *   SyncTriggerType 'import'     → trigger_type 'system' + operation_type 'import'
 *
 *   begin_integration_sync() retorna boolean (true = lock adquirido).
 *   integrations.status 'connected' = sync exitosa (no 'active').
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = import('@supabase/supabase-js').SupabaseClient<any>
import { randomUUID } from 'crypto'
import { getConnector } from '../connectors/registry'
import { decryptSecret } from './encryption'
import { matchResources } from './resource-matcher'
import { processAlerts } from './alert-engine'
import type { ConnectorError } from '../connectors/errors'

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export type SyncTriggerType =
  | 'manual'
  | 'scheduled'
  | 'webhook'
  | 'import'
  | 'credentials_validation'

export type SyncEngineInput = {
  readonly integrationId: string
  readonly organizationId: string
  readonly triggerType: SyncTriggerType
  readonly supabaseAdmin: AnySupabaseClient
}

export type SyncEngineOutput = {
  readonly syncRunId: string
  readonly status: 'completed' | 'failed' | 'partial'
  readonly resourcesFound: number
  readonly resourcesCreated: number
  readonly resourcesUpdated: number
  readonly resourcesUnchanged: number
  readonly resourcesFailed: number
  readonly durationMs: number
  readonly errors: ReadonlyArray<string>
}

// ── Mapas trigger ─────────────────────────────────────────────────────────────

function toDbTriggerType(t: SyncTriggerType): 'user' | 'cron' | 'webhook' | 'system' {
  switch (t) {
    case 'manual':
    case 'credentials_validation':
      return 'user'
    case 'scheduled':
      return 'cron'
    case 'webhook':
      return 'webhook'
    case 'import':
      return 'system'
  }
}

function toOperationType(t: SyncTriggerType): string {
  switch (t) {
    case 'manual':              return 'manual_sync'
    case 'scheduled':           return 'scheduled_sync'
    case 'webhook':             return 'webhook_sync'
    case 'import':              return 'import'
    case 'credentials_validation': return 'credentials_validation'
  }
}

// ── Motor principal ───────────────────────────────────────────────────────────

export async function runSync(input: SyncEngineInput): Promise<SyncEngineOutput> {
  const { integrationId, organizationId, triggerType, supabaseAdmin } = input
  const startedAt = Date.now()
  const syncRunId = randomUUID()
  const errors: string[] = []

  // 1. Cargar la integración (verificar que pertenece a la org)
  const integration = await loadIntegration(supabaseAdmin, integrationId, organizationId)
  if (!integration) {
    throw new Error(`Integración ${integrationId} no encontrada o no pertenece a la organización.`)
  }

  // 2. Crear el sync_run en estado 'pending'
  await createSyncRun(supabaseAdmin, {
    syncRunId,
    integrationId,
    organizationId,
    operationType: toOperationType(triggerType),
    triggerType: toDbTriggerType(triggerType),
  })

  // 3. Adquirir el lock atómico via begin_integration_sync()
  const lockResult = await acquireLock(supabaseAdmin, integrationId, syncRunId)
  if (!lockResult.success) {
    await failSyncRun(supabaseAdmin, syncRunId, lockResult.reason ?? 'No se pudo adquirir el lock.')
    return buildOutput(syncRunId, 'failed', {}, Date.now() - startedAt, [lockResult.reason ?? ''])
  }

  try {
    // 4. Obtener el conector
    const connector = getConnector(integration.connector_type)

    // 5. Descifrar secretos (en memoria, nunca logueados)
    const decryptedSecrets = await loadDecryptedSecrets(supabaseAdmin, integrationId)

    // 6. Llamar al conector
    const syncContext = {
      integrationId,
      organizationId,
      syncRunId,
      environment: integration.environment as 'production' | 'sandbox',
      decryptedSecrets,
    }

    const connectorResult = await connector.sync(syncContext)

    // 7. ResourceMatcher — upsert en external_resources
    const matcherOutput = await matchResources({
      supabase: supabaseAdmin,
      integrationId,
      organizationId,
      providerId: integration.provider_id,
      syncRunId,
      environment: integration.environment as 'production' | 'sandbox',
      domains: connectorResult.domains ?? [],
    })

    errors.push(
      ...matcherOutput.results
        .filter((r) => r.action === 'failed' && r.errorMessage)
        .map((r) => r.errorMessage!),
    )

    // 8. Determinar recursos persistentemente ausentes (consecutive_missing_syncs >= 2)
    const persistentlyMissing = await getPersistentlyMissingIds(
      supabaseAdmin,
      integrationId,
      integration.environment as string,
      matcherOutput.missingExternalIds,
    )

    // 9. AlertEngine
    await processAlerts({
      supabase: supabaseAdmin,
      organizationId,
      integrationId,
      syncRunId,
      environment: integration.environment as 'production' | 'sandbox',
      matcherOutput,
      persistentlyMissingResourceIds: persistentlyMissing,
      syncFailed: false,
    })

    const totalResources = connectorResult.domains?.length ?? 0
    const durationMs = Date.now() - startedAt
    const status = matcherOutput.failed > 0 ? 'partial' : 'completed'

    // 10. Completar sync_run
    await completeSyncRun(supabaseAdmin, {
      syncRunId,
      status,
      resourcesFound: totalResources,
      resourcesCreated: matcherOutput.created,
      resourcesUpdated: matcherOutput.updated,
      resourcesUnchanged: matcherOutput.unchanged,
      resourcesFailed: matcherOutput.failed,
      durationMs,
      errorSummary: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
    })

    // 11. Actualizar health metrics de la integración
    await updateIntegrationHealth(supabaseAdmin, integrationId, {
      succeeded: true,
      resourcesCount: totalResources,
      unassignedCount: matcherOutput.created,
      durationMs,
    })

    return buildOutput(
      syncRunId,
      status,
      {
        resourcesFound: totalResources,
        resourcesCreated: matcherOutput.created,
        resourcesUpdated: matcherOutput.updated,
        resourcesUnchanged: matcherOutput.unchanged,
        resourcesFailed: matcherOutput.failed,
      },
      durationMs,
      errors,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.'
    const durationMs = Date.now() - startedAt

    await failSyncRun(supabaseAdmin, syncRunId, message.slice(0, 500))

    await processAlerts({
      supabase: supabaseAdmin,
      organizationId,
      integrationId,
      syncRunId,
      environment: integration.environment as 'production' | 'sandbox',
      matcherOutput: { results: [], created: 0, updated: 0, unchanged: 0, failed: 0, missingExternalIds: [] },
      syncFailed: true,
      syncFailureReason: message.slice(0, 300),
    })

    await updateIntegrationHealth(supabaseAdmin, integrationId, {
      succeeded: false,
      resourcesCount: 0,
      unassignedCount: 0,
      durationMs,
    })

    return buildOutput(syncRunId, 'failed', {}, durationMs, [message])
  }
}

// ── Test de conexión ──────────────────────────────────────────────────────────

export async function runConnectionTest(input: Omit<SyncEngineInput, 'triggerType'>): Promise<{
  success: boolean
  userMessage: string
}> {
  const { integrationId, organizationId, supabaseAdmin } = input
  const syncRunId = randomUUID()

  const integration = await loadIntegration(supabaseAdmin, integrationId, organizationId)
  if (!integration) {
    return { success: false, userMessage: 'Integración no encontrada.' }
  }

  await createSyncRun(supabaseAdmin, {
    syncRunId,
    integrationId,
    organizationId,
    operationType: 'test_connection',
    triggerType: 'user',
  })

  try {
    const connector = getConnector(integration.connector_type)
    const decryptedSecrets = await loadDecryptedSecrets(supabaseAdmin, integrationId)
    const result = await connector.testConnection(decryptedSecrets, integration.environment as 'production' | 'sandbox')

    const success = result.success
    const userMessage = result.success
      ? 'Conexión verificada correctamente.'
      : (result.error as ConnectorError).userMessage

    await completeSyncRun(supabaseAdmin, {
      syncRunId,
      status: success ? 'completed' : 'failed',
      resourcesFound: 0,
      resourcesCreated: 0,
      resourcesUpdated: 0,
      resourcesUnchanged: 0,
      resourcesFailed: 0,
      durationMs: 0,
      errorSummary: success ? null : userMessage,
    })

    await supabaseAdmin
      .from('integrations')
      .update({
        last_connection_test_at: new Date().toISOString(),
        last_connection_test_status: success ? 'success' : 'failed',
      })
      .eq('id', integrationId)
      .eq('organization_id', organizationId)

    return { success, userMessage }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.'
    await failSyncRun(supabaseAdmin, syncRunId, message.slice(0, 500))
    return { success: false, userMessage: 'Error al probar la conexión.' }
  }
}

// ── Helpers internos ──────────────────────────────────────────────────────────

async function loadIntegration(
  supabase: AnySupabaseClient,
  integrationId: string,
  organizationId: string,
) {
  const { data } = await supabase
    .from('integrations')
    .select('id, connector_type, environment, status, provider_id')
    .eq('id', integrationId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single()
  return data
}

async function loadDecryptedSecrets(
  supabase: AnySupabaseClient,
  integrationId: string,
): Promise<ReadonlyMap<string, string>> {
  const { data, error } = await supabase
    .from('integration_secrets')
    .select('secret_type, secret_ciphertext')
    .eq('integration_id', integrationId)

  if (error) throw new Error(`Error al cargar secretos: ${error.message}`)

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    const plaintext = decryptSecret(row.secret_ciphertext as Buffer | string)
    map.set(row.secret_type as string, plaintext)
  }
  return map
}

async function createSyncRun(
  supabase: AnySupabaseClient,
  input: {
    syncRunId: string
    integrationId: string
    organizationId: string
    operationType: string
    triggerType: 'user' | 'cron' | 'webhook' | 'system'
  },
): Promise<void> {
  await supabase.from('integration_sync_runs').insert({
    id: input.syncRunId,
    integration_id: input.integrationId,
    organization_id: input.organizationId,
    operation_type: input.operationType,
    trigger_type: input.triggerType,
    status: 'pending',
    started_at: new Date().toISOString(),
  })
}

async function acquireLock(
  supabase: AnySupabaseClient,
  integrationId: string,
  syncRunId: string,
): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('begin_integration_sync', {
    p_integration_id: integrationId,
    p_sync_run_id: syncRunId,
    p_stale_timeout_min: 60,
  })

  if (error) return { success: false, reason: error.message }
  // begin_integration_sync retorna boolean: true = lock adquirido
  if (!data) return { success: false, reason: 'Hay otra sincronización en curso.' }
  return { success: true }
}

async function completeSyncRun(
  supabase: AnySupabaseClient,
  input: {
    syncRunId: string
    status: string
    resourcesFound: number
    resourcesCreated: number
    resourcesUpdated: number
    resourcesUnchanged: number
    resourcesFailed: number
    durationMs: number
    errorSummary: string | null
  },
): Promise<void> {
  await supabase
    .from('integration_sync_runs')
    .update({
      status: input.status,
      completed_at: new Date().toISOString(),
      duration_ms: input.durationMs,
      resources_found: input.resourcesFound,
      resources_created: input.resourcesCreated,
      resources_updated: input.resourcesUpdated,
      resources_unchanged: input.resourcesUnchanged,
      resources_failed: input.resourcesFailed,
      error_summary: input.errorSummary,
    })
    .eq('id', input.syncRunId)
}

async function failSyncRun(
  supabase: AnySupabaseClient,
  syncRunId: string,
  reason: string,
): Promise<void> {
  await supabase
    .from('integration_sync_runs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_summary: reason,
    })
    .eq('id', syncRunId)
}

async function updateIntegrationHealth(
  supabase: AnySupabaseClient,
  integrationId: string,
  input: {
    succeeded: boolean
    resourcesCount: number
    unassignedCount: number
    durationMs: number
  },
): Promise<void> {
  const now = new Date().toISOString()

  if (input.succeeded) {
    const { data: current } = await supabase
      .from('integrations')
      .select('average_sync_duration_ms')
      .eq('id', integrationId)
      .single()

    const prev = (current?.average_sync_duration_ms as number | null) ?? null
    const avg = prev === null
      ? input.durationMs
      : Math.round((prev * 0.8) + (input.durationMs * 0.2))  // EWMA suavizado

    await supabase
      .from('integrations')
      .update({
        last_successful_sync_at: now,
        last_sync_completed_at: now,
        last_sync_status: 'completed',
        consecutive_failures: 0,
        last_sync_duration_ms: input.durationMs,
        average_sync_duration_ms: avg,
        resources_count: input.resourcesCount,
        unassigned_resources_count: input.unassignedCount,
        status: 'connected',
      })
      .eq('id', integrationId)
  } else {
    // Leer el contador actual e incrementar (begin_integration_sync ya tiene el lock liberado)
    const { data: current } = await supabase
      .from('integrations')
      .select('consecutive_failures')
      .eq('id', integrationId)
      .single()

    const newCount = ((current?.consecutive_failures as number | null) ?? 0) + 1

    await supabase
      .from('integrations')
      .update({
        last_failed_sync_at: now,
        last_sync_completed_at: now,
        last_sync_status: 'failed',
        consecutive_failures: newCount,
        last_sync_duration_ms: input.durationMs,
        status: newCount >= 3 ? 'error' : 'degraded',
      })
      .eq('id', integrationId)
  }
}

async function getPersistentlyMissingIds(
  supabase: AnySupabaseClient,
  integrationId: string,
  environment: string,
  missingExternalIds: ReadonlyArray<string>,
): Promise<string[]> {
  if (missingExternalIds.length === 0) return []

  const { data } = await supabase
    .from('external_resources')
    .select('id')
    .eq('integration_id', integrationId)
    .eq('environment', environment)
    .in('external_resource_id', missingExternalIds as string[])
    .gte('consecutive_missing_syncs', 2)

  return (data ?? []).map((r) => r.id as string)
}

function buildOutput(
  syncRunId: string,
  status: 'completed' | 'failed' | 'partial',
  counts: Partial<{
    resourcesFound: number
    resourcesCreated: number
    resourcesUpdated: number
    resourcesUnchanged: number
    resourcesFailed: number
  }>,
  durationMs: number,
  errors: string[],
): SyncEngineOutput {
  return {
    syncRunId,
    status,
    resourcesFound: counts.resourcesFound ?? 0,
    resourcesCreated: counts.resourcesCreated ?? 0,
    resourcesUpdated: counts.resourcesUpdated ?? 0,
    resourcesUnchanged: counts.resourcesUnchanged ?? 0,
    resourcesFailed: counts.resourcesFailed ?? 0,
    durationMs,
    errors,
  }
}
