import { createHash } from 'crypto'
import type { NormalizedDomain } from '../types'
import { parseNamecheapDate, type NamecheapDomainRaw } from './schemas'

export function mapNamecheapDomain(raw: NamecheapDomainRaw): NormalizedDomain {
  const isExpired = raw.IsExpired === 'true'
  const autoRenew = raw.AutoRenew === 'true'
  const status: NormalizedDomain['status'] = isExpired ? 'expired' : 'active'

  const isoExpires = parseNamecheapDate(raw.Expires)
  const expiresOn = isoExpires ? new Date(isoExpires) : null

  const hashPayload = { status, expiresOn: isoExpires, autoRenew }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  const domainName = raw.Name.toLowerCase()

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
    registrarName: 'Namecheap',
    externalPayloadHash,
    rawMetadata: {
      id: raw.ID,
      name: raw.Name,
      user: raw.User,
      created: raw.Created,
      expires: raw.Expires,
      expiresOn: expiresOn?.toISOString() ?? null,
      autoRenew,
      isExpired,
      isLocked: raw.IsLocked === 'true',
      whoisGuard: raw.WhoisGuard,
      isPremium: raw.IsPremium === 'true',
      isOurDNS: raw.IsOurDNS === 'true',
    },
  } satisfies NormalizedDomain
}

export function mapNamecheapDomains(raws: ReadonlyArray<NamecheapDomainRaw>): NormalizedDomain[] {
  return raws.map(mapNamecheapDomain)
}
