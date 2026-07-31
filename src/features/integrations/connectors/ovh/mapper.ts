import { createHash } from 'crypto'
import type { NormalizedDomain, NormalizedHosting } from '../types'
import type { OvhDomainServiceInfoRaw, OvhHostingInfoRaw } from './schemas'

export function mapOvhDomain(
  serviceName: string,
  info: OvhDomainServiceInfoRaw,
): NormalizedDomain {
  const expiresOn = info.expiration ? new Date(info.expiration) : null
  const autoRenew = info.renew?.automatic ?? false

  const status = info.status === 'ok' ? 'active'
    : info.status === 'expired' ? 'expired'
    : 'unknown'

  const hashPayload = { status, expiresOn: expiresOn?.toISOString() ?? null, autoRenew }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'domain',
    externalId: serviceName.toLowerCase(),
    externalName: serviceName.toLowerCase(),
    externalStatus: status,
    domainName: serviceName.toLowerCase(),
    status,
    expiresOn,
    autoRenew,
    nameservers: [],
    registrarName: 'OVH',
    externalPayloadHash,
    rawMetadata: {
      serviceName,
      serviceId: info.serviceId,
      status: info.status,
      expiration: info.expiration,
      expiresOn: expiresOn?.toISOString() ?? null,
      autoRenew,
      renewPeriod: info.renew?.period ?? null,
    },
  } satisfies NormalizedDomain
}

export function mapOvhHosting(
  serviceName: string,
  info: OvhHostingInfoRaw,
): NormalizedHosting {
  const hashPayload = { state: info.state, offer: info.offer }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'hosting',
    externalId: serviceName,
    externalName: serviceName,
    externalStatus: info.state,
    externalPayloadHash,
    rawMetadata: {
      serviceName,
      primaryLogin: info.primaryLogin,
      offer: info.offer,
      state: info.state,
      hostingIp: info.hostingIp ?? null,
      cluster: info.cluster ?? null,
    },
  } satisfies NormalizedHosting
}
