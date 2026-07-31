import { createHash } from 'crypto'
import type { NormalizedDomain } from '../types'
import type { PorkbunDomainRaw } from './schemas'

export function mapPorkbunDomain(raw: PorkbunDomainRaw): NormalizedDomain {
  const autoRenew = raw.autoRenew === '1'
  const statusRaw = raw.status.toUpperCase()
  const status: NormalizedDomain['status'] =
    statusRaw === 'ACTIVE' ? 'active'
    : statusRaw === 'EXPIRED' ? 'expired'
    : statusRaw === 'CANCELLED' || statusRaw === 'CANCELED' ? 'cancelled'
    : 'unknown'

  // Porkbun uses 'YYYY-MM-DD HH:mm:ss' format
  const expiresOn = raw.expireDate ? new Date(raw.expireDate.replace(' ', 'T') + 'Z') : null

  const hashPayload = { status, expiresOn: expiresOn?.toISOString() ?? null, autoRenew }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  const domainName = raw.domain.toLowerCase()

  return {
    resourceType: 'domain',
    externalId: domainName,
    externalName: domainName,
    externalStatus: status,
    domainName,
    status,
    expiresOn,
    autoRenew,
    nameservers: [],
    registrarName: 'Porkbun',
    externalPayloadHash,
    rawMetadata: {
      domain: raw.domain,
      status: raw.status,
      tld: raw.tld,
      createDate: raw.createDate,
      expireDate: raw.expireDate,
      expiresOn: expiresOn?.toISOString() ?? null,
      autoRenew,
      securityLock: raw.securityLock === '1',
      whoisPrivacy: raw.whoisPrivacy === '1',
    },
  } satisfies NormalizedDomain
}

export function mapPorkbunDomains(raws: ReadonlyArray<PorkbunDomainRaw>): NormalizedDomain[] {
  return raws.map(mapPorkbunDomain)
}
