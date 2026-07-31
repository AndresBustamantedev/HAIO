import { createHash } from 'crypto'
import type { NormalizedDNSZone } from '../types'
import type { CloudflareZoneRaw } from './schemas'

export function mapCloudflareZone(raw: CloudflareZoneRaw): NormalizedDNSZone {
  const status = raw.paused ? 'paused' : raw.status

  const hashPayload = { status, nameServers: [...raw.name_servers].sort() }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'dns_zone',
    externalId: raw.id,
    externalName: raw.name,
    externalStatus: status,
    externalPayloadHash,
    rawMetadata: {
      zoneId: raw.id,
      name: raw.name,
      status: raw.status,
      paused: raw.paused,
      type: raw.type,
      nameServers: raw.name_servers,
      originalNameServers: raw.original_name_servers ?? null,
      accountId: raw.account.id,
      accountName: raw.account.name,
      plan: raw.plan?.name ?? null,
      createdOn: raw.created_on,
      modifiedOn: raw.modified_on,
    },
  } satisfies NormalizedDNSZone
}

export function mapCloudflareZones(raws: ReadonlyArray<CloudflareZoneRaw>): NormalizedDNSZone[] {
  return raws.map(mapCloudflareZone)
}
