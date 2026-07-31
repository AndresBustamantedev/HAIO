/**
 * ResourceMatcher — Compara los recursos normalizados recibidos del conector
 * con los external_resources existentes en la base de datos.
 *
 * Responsabilidades:
 * - Crear registros nuevos (action: 'created')
 * - Actualizar registros cuando el payload_hash cambia (action: 'updated')
 * - Marcar como sin cambios cuando el hash coincide (action: 'unchanged')
 * - Incrementar consecutive_missing_syncs para recursos no vistos en esta sync
 *
 * Nunca:
 * - Borra registros de external_resources (baja lógica vía missing syncs)
 * - Sobrescribe campos manejados manualmente: local_resource_id, etc.
 * - Crea alertas directamente (eso es responsabilidad del AlertEngine)
 *
 * Columnas de external_resources (migración 0017):
 *   external_name, raw_metadata, external_status, external_payload_hash
 *   Todos los datos del recurso van en raw_metadata.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<any>
import type { NormalizedResource, NormalizedResourceBase } from '../connectors/types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type MatchAction = 'created' | 'updated' | 'unchanged' | 'failed'

export type MatchResult = {
  readonly externalResourceId: string
  readonly externalResourceType: string
  readonly action: MatchAction
  readonly resourceDbId?: string
  readonly errorMessage?: string
}

export type MatcherInput = {
  readonly supabase: SupabaseClient
  readonly integrationId: string
  readonly organizationId: string
  readonly providerId: string | null
  readonly syncRunId: string
  readonly environment: 'production' | 'sandbox'
  readonly resources: ReadonlyArray<NormalizedResource>
}

export type MatcherOutput = {
  readonly results: ReadonlyArray<MatchResult>
  readonly created: number
  readonly updated: number
  readonly unchanged: number
  readonly failed: number
  /** IDs externos que NO aparecieron en esta sync. */
  readonly missingExternalIds: ReadonlyArray<string>
}

// ── Campos que el SyncEngine NUNCA debe sobrescribir ─────────────────────────

const PROTECTED_FIELDS = new Set([
  'local_resource_id',
  'local_resource_type',
])

// ── Función principal ─────────────────────────────────────────────────────────

export async function matchResources(input: MatcherInput): Promise<MatcherOutput> {
  const { supabase, integrationId, organizationId, providerId, environment, resources } = input

  // 1. Cargar todos los external_resources existentes para esta integración+entorno
  const { data: existing, error: fetchError } = await supabase
    .from('external_resources')
    .select('id, external_resource_id, external_resource_type, external_payload_hash, consecutive_missing_syncs')
    .eq('integration_id', integrationId)
    .eq('environment', environment)

  if (fetchError) {
    throw new Error(
      `[ResourceMatcher] Error al cargar external_resources: ${fetchError.message}`,
    )
  }

  // Indexar por (type, external_resource_id) para O(1) lookup
  const existingMap = new Map<string, ExistingResource>()
  for (const row of existing ?? []) {
    const key = buildKey(row.external_resource_type as string, row.external_resource_id as string)
    existingMap.set(key, row as ExistingResource)
  }

  const results: MatchResult[] = []
  const seenKeys = new Set<string>()

  // 2. Procesar cada recurso recibido
  for (const resource of resources) {
    const key = buildKey(resource.resourceType, resource.externalId)
    seenKeys.add(key)

    const found = existingMap.get(key)

    if (!found) {
      const result = await createResource(supabase, {
        integrationId,
        organizationId,
        providerId,
        environment,
        resource,
      })
      results.push(result)
    } else if (found.external_payload_hash !== resource.externalPayloadHash) {
      const result = await updateResource(supabase, { resourceDbId: found.id, resource })
      results.push(result)
    } else {
      const result = await touchResource(supabase, found.id, resource.externalId, resource.resourceType)
      results.push(result)
    }
  }

  // 3. Incrementar consecutive_missing_syncs para los no vistos
  const missingKeys = Array.from(existingMap.keys()).filter((k) => !seenKeys.has(k))
  const missingExternalIds = missingKeys.map((k) => k.split('\x00')[1])

  if (missingExternalIds.length > 0) {
    await incrementMissingSyncs(supabase, integrationId, environment, missingExternalIds)
  }

  // 4. Resetear consecutive_missing_syncs para los sí vistos
  const seenDbIds = Array.from(seenKeys)
    .map((k) => existingMap.get(k)?.id)
    .filter((id): id is string => id !== undefined)

  if (seenDbIds.length > 0) {
    await resetMissingSyncs(supabase, seenDbIds)
  }

  return {
    results,
    ...summarize(results),
    missingExternalIds,
  }
}

// ── Helpers de indexado ───────────────────────────────────────────────────────

function buildKey(resourceType: string, externalId: string): string {
  return `${resourceType}\x00${externalId}`
}

// ── Operaciones individuales ──────────────────────────────────────────────────

type ExistingResource = {
  id: string
  external_resource_id: string
  external_resource_type: string
  external_payload_hash: string | null
  consecutive_missing_syncs: number
}

async function createResource(
  supabase: SupabaseClient,
  input: {
    integrationId: string
    organizationId: string
    providerId: string | null
    environment: string
    resource: NormalizedResourceBase
  },
): Promise<MatchResult> {
  const { integrationId, organizationId, providerId, environment, resource } = input

  const { data, error } = await supabase
    .from('external_resources')
    .insert({
      integration_id: integrationId,
      organization_id: organizationId,
      ...(providerId ? { provider_id: providerId } : {}),
      environment,
      external_resource_type: resource.resourceType,
      external_resource_id: resource.externalId,
      external_name: resource.externalName,
      external_status: resource.externalStatus,
      external_payload_hash: resource.externalPayloadHash,
      raw_metadata: resource.rawMetadata,
      last_seen_at: new Date().toISOString(),
      consecutive_missing_syncs: 0,
    })
    .select('id')
    .single()

  if (error) {
    return {
      externalResourceId: resource.externalId,
      externalResourceType: resource.resourceType,
      action: 'failed',
      errorMessage: error.message,
    }
  }

  return {
    externalResourceId: resource.externalId,
    externalResourceType: resource.resourceType,
    action: 'created',
    resourceDbId: data.id,
  }
}

async function updateResource(
  supabase: SupabaseClient,
  input: { resourceDbId: string; resource: NormalizedResourceBase },
): Promise<MatchResult> {
  const { resourceDbId, resource } = input

  // NUNCA se tocan: local_resource_id, local_resource_type
  const { error } = await supabase
    .from('external_resources')
    .update({
      external_name: resource.externalName,
      external_status: resource.externalStatus,
      external_payload_hash: resource.externalPayloadHash,
      raw_metadata: resource.rawMetadata,
      last_seen_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      consecutive_missing_syncs: 0,
    })
    .eq('id', resourceDbId)

  if (error) {
    return {
      externalResourceId: resource.externalId,
      externalResourceType: resource.resourceType,
      action: 'failed',
      resourceDbId,
      errorMessage: error.message,
    }
  }

  return {
    externalResourceId: resource.externalId,
    externalResourceType: resource.resourceType,
    action: 'updated',
    resourceDbId,
  }
}

async function touchResource(
  supabase: SupabaseClient,
  resourceDbId: string,
  externalId: string,
  resourceType: string,
): Promise<MatchResult> {
  await supabase
    .from('external_resources')
    .update({
      last_seen_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', resourceDbId)

  return {
    externalResourceId: externalId,
    externalResourceType: resourceType,
    action: 'unchanged',
    resourceDbId,
  }
}

async function incrementMissingSyncs(
  supabase: SupabaseClient,
  integrationId: string,
  environment: string,
  missingExternalIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc('increment_missing_syncs', {
    p_integration_id: integrationId,
    p_environment: environment,
    p_external_ids: missingExternalIds,
  })

  if (error) {
    for (const extId of missingExternalIds) {
      await supabase.rpc('increment_missing_syncs_single', {
        p_integration_id: integrationId,
        p_environment: environment,
        p_external_id: extId,
      })
    }
  }
}

async function resetMissingSyncs(
  supabase: SupabaseClient,
  resourceDbIds: string[],
): Promise<void> {
  if (resourceDbIds.length === 0) return
  await supabase
    .from('external_resources')
    .update({ consecutive_missing_syncs: 0 })
    .in('id', resourceDbIds)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function summarize(results: MatchResult[]) {
  return results.reduce(
    (acc, r) => {
      acc[r.action === 'created' ? 'created'
        : r.action === 'updated' ? 'updated'
        : r.action === 'unchanged' ? 'unchanged'
        : 'failed']++
      return acc
    },
    { created: 0, updated: 0, unchanged: 0, failed: 0 },
  )
}

export { PROTECTED_FIELDS }
