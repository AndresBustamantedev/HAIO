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
 *   external_name (no external_display_name)
 *   raw_metadata  (no external_metadata)
 *   — expires_on, nameservers, auto_renew, registrar_name van dentro de raw_metadata
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<any>
import type { NormalizedDomain } from '../connectors/types'

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
  readonly domains: ReadonlyArray<NormalizedDomain>
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
  const { supabase, integrationId, organizationId, providerId, syncRunId, environment, domains } = input

  // 1. Cargar todos los external_resources existentes para esta integración
  const { data: existing, error: fetchError } = await supabase
    .from('external_resources')
    .select('id, external_resource_id, external_resource_type, external_payload_hash, consecutive_missing_syncs')
    .eq('integration_id', integrationId)
    .eq('environment', environment)
    .eq('external_resource_type', 'domain')

  if (fetchError) {
    throw new Error(
      `[ResourceMatcher] Error al cargar external_resources: ${fetchError.message}`,
    )
  }

  // Indexar por external_resource_id para O(1) lookup
  const existingMap = new Map<string, ExistingResource>()
  for (const row of existing ?? []) {
    existingMap.set(row.external_resource_id as string, row as ExistingResource)
  }

  const results: MatchResult[] = []
  const seenExternalIds = new Set<string>()

  // 2. Procesar cada dominio recibido
  for (const domain of domains) {
    seenExternalIds.add(domain.externalId)

    const existing = existingMap.get(domain.externalId)

    if (!existing) {
      const result = await createResource(supabase, {
        integrationId,
        organizationId,
        providerId,
        syncRunId,
        environment,
        domain,
      })
      results.push(result)
    } else if (existing.external_payload_hash !== domain.externalPayloadHash) {
      const result = await updateResource(supabase, {
        resourceDbId: existing.id,
        domain,
      })
      results.push(result)
    } else {
      const result = await touchResource(supabase, existing.id, domain.externalId)
      results.push(result)
    }
  }

  // 3. Incrementar consecutive_missing_syncs para los no vistos
  const missingIds = Array.from(existingMap.keys()).filter((id) => !seenExternalIds.has(id))
  if (missingIds.length > 0) {
    await incrementMissingSyncs(supabase, integrationId, environment, missingIds)
  }

  // 4. Resetear consecutive_missing_syncs para los sí vistos
  const seenDbIds = Array.from(seenExternalIds)
    .map((extId) => existingMap.get(extId)?.id)
    .filter((id): id is string => id !== undefined)

  if (seenDbIds.length > 0) {
    await resetMissingSyncs(supabase, seenDbIds)
  }

  const counts = summarize(results)

  return {
    results,
    ...counts,
    missingExternalIds: missingIds,
  }
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
    syncRunId: string
    environment: string
    domain: NormalizedDomain
  },
): Promise<MatchResult> {
  const { integrationId, organizationId, providerId, environment, domain } = input

  // Los campos específicos del dominio (expires_on, nameservers, etc.)
  // no tienen columnas propias en external_resources — van en raw_metadata.
  const rawMetadata = {
    ...domain.rawMetadata,
    expiresOn: domain.expiresOn?.toISOString() ?? null,
    autoRenew: domain.autoRenew,
    nameservers: domain.nameservers,
    registrarName: domain.registrarName,
  }

  const { data, error } = await supabase
    .from('external_resources')
    .insert({
      integration_id: integrationId,
      organization_id: organizationId,
      ...(providerId ? { provider_id: providerId } : {}),
      environment,
      external_resource_type: 'domain',
      external_resource_id: domain.externalId,
      external_name: domain.domainName,
      external_status: domain.status,
      external_payload_hash: domain.externalPayloadHash,
      raw_metadata: rawMetadata,
      last_seen_at: new Date().toISOString(),
      consecutive_missing_syncs: 0,
    })
    .select('id')
    .single()

  if (error) {
    return {
      externalResourceId: domain.externalId,
      externalResourceType: 'domain',
      action: 'failed',
      errorMessage: error.message,
    }
  }

  return {
    externalResourceId: domain.externalId,
    externalResourceType: 'domain',
    action: 'created',
    resourceDbId: data.id,
  }
}

async function updateResource(
  supabase: SupabaseClient,
  input: {
    resourceDbId: string
    domain: NormalizedDomain
  },
): Promise<MatchResult> {
  const { resourceDbId, domain } = input

  // Solo se actualizan los campos que puede gestionar la sincronización.
  // NUNCA se tocan: local_resource_id, local_resource_type (ajuste 12).
  const rawMetadata = {
    ...domain.rawMetadata,
    expiresOn: domain.expiresOn?.toISOString() ?? null,
    autoRenew: domain.autoRenew,
    nameservers: domain.nameservers,
    registrarName: domain.registrarName,
  }

  const { error } = await supabase
    .from('external_resources')
    .update({
      external_name: domain.domainName,
      external_status: domain.status,
      external_payload_hash: domain.externalPayloadHash,
      raw_metadata: rawMetadata,
      last_seen_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      consecutive_missing_syncs: 0,
    })
    .eq('id', resourceDbId)

  if (error) {
    return {
      externalResourceId: domain.externalId,
      externalResourceType: 'domain',
      action: 'failed',
      resourceDbId,
      errorMessage: error.message,
    }
  }

  return {
    externalResourceId: domain.externalId,
    externalResourceType: 'domain',
    action: 'updated',
    resourceDbId,
  }
}

async function touchResource(
  supabase: SupabaseClient,
  resourceDbId: string,
  externalId: string,
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
    externalResourceType: 'domain',
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
    // Fallback: actualizar uno a uno
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
