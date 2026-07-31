/**
 * Tipos de aplicación para el módulo de integraciones.
 *
 * Estos tipos representan las filas tal como se devuelven desde la vista
 * v_integrations_safe (nunca expone secret_ciphertext) y las tablas relacionadas.
 */

/** Refleja el enum integration_status de la migración 0017. */
export type IntegrationStatus =
  | 'disconnected'
  | 'pending'
  | 'connected'
  | 'degraded'
  | 'error'
  | 'disabled'

export type IntegrationEnvironment = 'production' | 'sandbox'

/** Refleja el enum sync_run_status de la migración 0017. */
export type SyncRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'

export type SyncOperationType =
  | 'test_connection'
  | 'initial_sync'
  | 'manual_sync'
  | 'scheduled_sync'
  | 'webhook_sync'
  | 'import'
  | 'credentials_validation'

/** Refleja el enum alert_severity de la migración 0017. */
export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

/** Refleja el enum alert_status de la migración 0017. */
export type AlertStatus =
  | 'active'
  | 'acknowledged'
  | 'muted'
  | 'resolved'
  | 'ignored'

export type AlertType =
  | 'domain_expiring_soon'
  | 'domain_expired'
  | 'domain_missing'
  | 'ssl_expiring_soon'
  | 'ssl_expired'
  | 'sync_failed'
  | 'sync_stale'
  | 'connection_failed'
  | 'resource_missing'

/** Integración tal como la devuelve la vista v_integrations_safe. */
export type Integration = {
  id: string
  organization_id: string
  provider_id: string
  provider_account_id: string | null
  connector_type: string
  environment: IntegrationEnvironment
  name: string
  status: IntegrationStatus
  sync_enabled: boolean
  sync_frequency: 'hourly' | 'daily' | 'weekly'
  last_successful_sync_at: string | null
  last_failed_sync_at: string | null
  consecutive_failures: number
  average_sync_duration_ms: number | null
  last_sync_duration_ms: number | null
  resources_count: number
  unassigned_resources_count: number
  active_alerts_count: number
  last_connection_test_at: string | null
  last_connection_test_status: 'success' | 'failed' | null
  configured_secret_types: string[]
  provider_name: string | null
  provider_category: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type IntegrationSyncRun = {
  id: string
  integration_id: string
  organization_id: string
  operation_type: SyncOperationType
  trigger_type: 'user' | 'cron' | 'webhook' | 'system'
  status: SyncRunStatus
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  resources_found: number
  resources_created: number
  resources_updated: number
  resources_unchanged: number
  resources_failed: number
  error_summary: string | null
  created_at: string
}

export type ExternalResource = {
  id: string
  integration_id: string
  organization_id: string
  provider_id: string
  environment: IntegrationEnvironment
  external_resource_type: string
  external_resource_id: string
  local_resource_type: string | null
  local_resource_id: string | null
  external_name: string | null
  external_status: string | null
  external_payload_hash: string | null
  consecutive_missing_syncs: number
  last_seen_at: string | null
  last_synced_at: string | null
  raw_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type InfrastructureAlert = {
  id: string
  organization_id: string
  integration_id: string | null
  client_id: string | null
  resource_type: string | null
  resource_id: string | null
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  description: string | null
  fingerprint: string
  status: AlertStatus
  detected_at: string
  last_detected_at: string
  resolved_at: string | null
  resolution_reason: string | null
  muted_until: string | null
  acknowledged_at: string | null
  acknowledged_by: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
