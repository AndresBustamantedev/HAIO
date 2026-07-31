/**
 * AlertEngine — Genera y resuelve alertas de infraestructura.
 *
 * Reglas de deduplicación:
 *   fingerprint = SHA-256(org:integration:environment:alert_type:resource_type:resource_id)
 *   Un único índice parcial en la DB garantiza que no exista más de una alerta
 *   activa por fingerprint (status NOT IN ('resolved', 'ignored')).
 *
 * El engine no elimina alertas. Solo las resuelve (status → 'resolved').
 * Las alertas 'muted' se respetan: no se reabren hasta que muted_until expire.
 *
 * Columnas de infrastructure_alerts (migración 0017):
 *   - status: 'active' (no 'open')
 *   - description (no 'message')
 *   - metadata (no 'alert_metadata')
 *   - NO columna environment (se codifica solo en fingerprint)
 */

import { createHash } from 'crypto'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<any>
import type { MatcherOutput } from './resource-matcher'
import type { AlertSeverity, AlertType } from '../types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AlertInput = {
  readonly supabase: SupabaseClient
  readonly organizationId: string
  readonly integrationId: string
  readonly syncRunId: string
  readonly environment: 'production' | 'sandbox'
  readonly matcherOutput: MatcherOutput
  readonly persistentlyMissingResourceIds?: ReadonlyArray<string>
  readonly syncFailed?: boolean
  readonly syncFailureReason?: string
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function processAlerts(input: AlertInput): Promise<void> {
  const {
    supabase,
    organizationId,
    integrationId,
    syncRunId,
    environment,
    matcherOutput,
    persistentlyMissingResourceIds = [],
    syncFailed = false,
    syncFailureReason,
  } = input

  const now = new Date()

  // 1. Alerta de sync fallida
  if (syncFailed) {
    await upsertAlert(supabase, {
      organizationId,
      integrationId,
      environment,
      alertType: 'sync_failed',
      severity: 'high',
      resourceType: null,
      resourceId: null,
      title: 'Sincronización fallida',
      description: syncFailureReason ?? 'La sincronización no pudo completarse.',
      metadata: { syncRunId },
    })
  } else {
    await resolveAlerts(supabase, {
      organizationId,
      integrationId,
      alertTypes: ['sync_failed'],
      reason: 'Sincronización completada correctamente.',
    })
  }

  // 2. Alertas de recursos con missing syncs ≥ 2
  for (const resourceId of persistentlyMissingResourceIds) {
    await upsertAlert(supabase, {
      organizationId,
      integrationId,
      environment,
      alertType: 'resource_missing',
      severity: 'medium',
      resourceType: 'domain',
      resourceId,
      title: 'Recurso no encontrado en el proveedor',
      description:
        'Este recurso no ha aparecido en las últimas 2 o más sincronizaciones. ' +
        'Verifica si fue cancelado o transferido.',
      metadata: { syncRunId },
    })
  }

  // Resolver alertas de recursos que sí aparecieron en esta sync
  for (const result of matcherOutput.results) {
    if (result.action !== 'failed' && result.resourceDbId) {
      await resolveAlerts(supabase, {
        organizationId,
        integrationId,
        alertTypes: ['resource_missing'],
        resourceType: 'domain',
        resourceId: result.resourceDbId,
        reason: 'El recurso volvió a aparecer en la sincronización.',
      })
    }
  }

  // 3. Alertas de vencimiento de dominios
  await processExpirationAlerts(supabase, {
    organizationId,
    integrationId,
    environment,
    syncRunId,
    now,
    resourceType: 'domain',
    expiredAlertType: 'domain_expired',
    expiringSoonAlertType: 'domain_expiring_soon',
    resourceLabel: 'Dominio',
  })

  // 4. Alertas de vencimiento de certificados SSL
  await processExpirationAlerts(supabase, {
    organizationId,
    integrationId,
    environment,
    syncRunId,
    now,
    resourceType: 'ssl_certificate',
    expiredAlertType: 'ssl_expired',
    expiringSoonAlertType: 'ssl_expiring_soon',
    resourceLabel: 'Certificado SSL',
  })
}

// ── Alertas de vencimiento ────────────────────────────────────────────────────

async function processExpirationAlerts(
  supabase: SupabaseClient,
  ctx: {
    organizationId: string
    integrationId: string
    environment: string
    syncRunId: string
    now: Date
    resourceType: string
    expiredAlertType: AlertType
    expiringSoonAlertType: AlertType
    resourceLabel: string
  },
): Promise<void> {
  const {
    organizationId, integrationId, environment, syncRunId, now,
    resourceType, expiredAlertType, expiringSoonAlertType, resourceLabel,
  } = ctx

  // expiresOn no tiene columna propia — está en raw_metadata.expiresOn
  const { data: resources } = await supabase
    .from('external_resources')
    .select('id, external_name, raw_metadata')
    .eq('integration_id', integrationId)
    .eq('environment', environment)
    .eq('external_resource_type', resourceType)

  if (!resources) return

  for (const resource of resources) {
    const meta = resource.raw_metadata as Record<string, unknown>
    const expiresOnRaw = meta?.expiresOn
    if (!expiresOnRaw || typeof expiresOnRaw !== 'string') continue

    const expiresOn = new Date(expiresOnRaw)
    if (isNaN(expiresOn.getTime())) continue

    const daysUntilExpiry = Math.ceil(
      (expiresOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    const resourceName = (resource.external_name as string | null) ?? resource.id

    if (daysUntilExpiry < 0) {
      await upsertAlert(supabase, {
        organizationId,
        integrationId,
        environment,
        alertType: expiredAlertType,
        severity: 'critical',
        resourceType,
        resourceId: resource.id as string,
        title: `${resourceLabel} expirado: ${resourceName}`,
        description: `El ${resourceLabel.toLowerCase()} expiró el ${expiresOn.toLocaleDateString('es-ES')}.`,
        metadata: { syncRunId, expiresOn: expiresOnRaw, daysUntilExpiry },
      })
    } else if (daysUntilExpiry <= 30) {
      const severity: AlertSeverity = daysUntilExpiry <= 7 ? 'critical' : 'medium'
      await upsertAlert(supabase, {
        organizationId,
        integrationId,
        environment,
        alertType: expiringSoonAlertType,
        severity,
        resourceType,
        resourceId: resource.id as string,
        title: `${resourceLabel} próximo a vencer: ${resourceName}`,
        description: `Expira en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'} (${expiresOn.toLocaleDateString('es-ES')}).`,
        metadata: { syncRunId, expiresOn: expiresOnRaw, daysUntilExpiry },
      })
    } else {
      await resolveAlerts(supabase, {
        organizationId,
        integrationId,
        alertTypes: [expiringSoonAlertType, expiredAlertType],
        resourceType,
        resourceId: resource.id as string,
        reason: `El ${resourceLabel.toLowerCase()} ya no está próximo a vencer.`,
      })
    }
  }
}

// ── Upsert y resolución ───────────────────────────────────────────────────────

type UpsertAlertInput = {
  organizationId: string
  integrationId: string
  environment: string
  alertType: AlertType
  severity: AlertSeverity
  resourceType: string | null
  resourceId: string | null
  title: string
  description: string
  metadata?: Record<string, unknown>
}

async function upsertAlert(
  supabase: SupabaseClient,
  input: UpsertAlertInput,
): Promise<void> {
  const fingerprint = buildFingerprint(input)

  const { data: existing } = await supabase
    .from('infrastructure_alerts')
    .select('id, status, muted_until')
    .eq('organization_id', input.organizationId)
    .eq('fingerprint', fingerprint)
    .not('status', 'in', '("resolved","ignored")')
    .maybeSingle()

  if (existing) {
    // Respetar mute activo
    if (existing.status === 'muted') {
      const mutedUntil = existing.muted_until ? new Date(existing.muted_until as string) : null
      if (mutedUntil && mutedUntil > new Date()) return
    }

    // Actualizar severity/description y marcar como activa (en caso de que fuera acknowledged)
    await supabase
      .from('infrastructure_alerts')
      .update({
        severity: input.severity,
        title: input.title,
        description: input.description,
        metadata: input.metadata ?? {},
        last_detected_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', existing.id)

    return
  }

  // Crear nueva alerta
  await supabase.from('infrastructure_alerts').insert({
    organization_id: input.organizationId,
    integration_id: input.integrationId,
    alert_type: input.alertType,
    severity: input.severity,
    status: 'active',
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    title: input.title,
    description: input.description,
    metadata: input.metadata ?? {},
    fingerprint,
  })
}

type ResolveAlertsInput = {
  organizationId: string
  integrationId: string
  alertTypes: AlertType[]
  resourceType?: string
  resourceId?: string
  reason: string
}

async function resolveAlerts(
  supabase: SupabaseClient,
  input: ResolveAlertsInput,
): Promise<void> {
  let query = supabase
    .from('infrastructure_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_reason: input.reason,
    })
    .eq('organization_id', input.organizationId)
    .eq('integration_id', input.integrationId)
    .in('alert_type', input.alertTypes)
    .not('status', 'in', '("resolved","ignored")')

  if (input.resourceType) {
    query = query.eq('resource_type', input.resourceType)
  }
  if (input.resourceId) {
    query = query.eq('resource_id', input.resourceId)
  }

  await query
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

function buildFingerprint(input: Pick<UpsertAlertInput,
  'organizationId' | 'integrationId' | 'environment' | 'alertType' | 'resourceType' | 'resourceId'
>): string {
  const parts = [
    input.organizationId,
    input.integrationId,
    input.environment,
    input.alertType,
    input.resourceType ?? '_',
    input.resourceId ?? '_',
  ]
  return createHash('sha256').update(parts.join(':')).digest('hex')
}
