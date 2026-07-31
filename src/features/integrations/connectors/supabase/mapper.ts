import { createHash } from 'crypto'
import type { NormalizedProject } from '../types'
import type { SupabaseProjectRaw } from './schemas'

export function mapSupabaseProject(raw: SupabaseProjectRaw): NormalizedProject {
  const status = raw.status === 'ACTIVE_HEALTHY' ? 'active'
    : raw.status === 'PAUSED' ? 'paused'
    : raw.status === 'INACTIVE' || raw.status === 'REMOVED' ? 'inactive'
    : 'unknown'

  const hashPayload = { status, region: raw.region }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'project',
    externalId: raw.id,
    externalName: raw.name,
    externalStatus: status,
    externalPayloadHash,
    rawMetadata: {
      projectRef: raw.id,
      name: raw.name,
      organizationId: raw.organization_id,
      status: raw.status,
      region: raw.region,
      createdAt: raw.created_at,
      dbHost: raw.database?.host ?? null,
      dbVersion: raw.database?.version ?? null,
    },
  } satisfies NormalizedProject
}

export function mapSupabaseProjects(raws: ReadonlyArray<SupabaseProjectRaw>): NormalizedProject[] {
  return raws.map(mapSupabaseProject)
}
