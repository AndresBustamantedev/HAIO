export type SupabaseProjectStatus =
  | 'ACTIVE_HEALTHY'
  | 'ACTIVE_UNHEALTHY'
  | 'COMING_UP'
  | 'GOING_DOWN'
  | 'INACTIVE'
  | 'INIT_FAILED'
  | 'REMOVED'
  | 'RESTORING'
  | 'PAUSED'
  | 'UNKNOWN'

export type SupabaseProject = {
  id: string
  name: string
  organization_id: string
  status: SupabaseProjectStatus
  region: string
  created_at: string
  database?: { host: string; version: string }
}
