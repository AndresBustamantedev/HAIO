import { createHash } from 'crypto'
import type { NormalizedProject, NormalizedDeployment } from '../types'
import type { VercelProjectRaw, VercelDeploymentRaw } from './schemas'

export function mapVercelProject(raw: VercelProjectRaw): NormalizedProject {
  const hashPayload = { name: raw.name, framework: raw.framework ?? null }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  const createdTs = raw.createdAt ?? 0
  const updatedTs = raw.updatedAt ?? raw.createdAt ?? 0

  return {
    resourceType: 'project',
    externalId: raw.id,
    externalName: raw.name,
    externalStatus: 'active',
    externalPayloadHash,
    rawMetadata: {
      projectId: raw.id,
      name: raw.name,
      framework: raw.framework ?? null,
      createdAt: createdTs ? new Date(createdTs).toISOString() : null,
      updatedAt: updatedTs ? new Date(updatedTs).toISOString() : null,
      repoType: raw.link?.type ?? null,
      repo: raw.link?.repo ?? null,
    },
  } satisfies NormalizedProject
}

export function mapVercelDeployment(raw: VercelDeploymentRaw): NormalizedDeployment {
  // v7 usa readyState; versiones anteriores usaban state
  const state = raw.readyState ?? raw.state ?? 'UNKNOWN'
  const createdTs = raw.createdAt ?? raw.created ?? 0
  const url = raw.url ?? null

  const hashPayload = { state, target: raw.target ?? null }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'deployment',
    externalId: raw.uid,
    externalName: url ? `${raw.name} — ${url}` : raw.name,
    externalStatus: state.toLowerCase(),
    externalPayloadHash,
    rawMetadata: {
      uid: raw.uid,
      name: raw.name,
      url,
      state,
      target: raw.target ?? null,
      createdAt: createdTs ? new Date(createdTs).toISOString() : null,
    },
  } satisfies NormalizedDeployment
}
