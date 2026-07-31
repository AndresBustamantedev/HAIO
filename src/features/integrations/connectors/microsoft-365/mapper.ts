import { createHash } from 'crypto'
import type { NormalizedDomain, NormalizedMailbox } from '../types'
import type { Ms365DomainRaw, Ms365UserRaw } from './schemas'

export function mapMs365Domain(raw: Ms365DomainRaw): NormalizedDomain {
  const status: NormalizedDomain['status'] = raw.isVerified ? 'active' : 'pending'

  const hashPayload = { status, isDefault: raw.isDefault, authenticationType: raw.authenticationType }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'domain',
    externalId: raw.id,
    externalName: raw.id,
    externalStatus: status,
    domainName: raw.id,
    status,
    expiresOn: null,
    autoRenew: false,
    nameservers: [],
    registrarName: 'Microsoft 365',
    externalPayloadHash,
    rawMetadata: {
      domain: raw.id,
      isDefault: raw.isDefault,
      isVerified: raw.isVerified,
      isInitial: raw.isInitial,
      authenticationType: raw.authenticationType,
      expiresOn: null,
    },
  } satisfies NormalizedDomain
}

export function mapMs365User(raw: Ms365UserRaw): NormalizedMailbox {
  const status = raw.accountEnabled ? 'active' : 'disabled'

  const hashPayload = { status, jobTitle: raw.jobTitle ?? null, department: raw.department ?? null }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'mailbox',
    externalId: raw.id,
    externalName: raw.userPrincipalName,
    externalStatus: status,
    externalPayloadHash,
    rawMetadata: {
      userId: raw.id,
      displayName: raw.displayName,
      userPrincipalName: raw.userPrincipalName,
      mail: raw.mail ?? null,
      accountEnabled: raw.accountEnabled,
      createdDateTime: raw.createdDateTime ?? null,
      jobTitle: raw.jobTitle ?? null,
      department: raw.department ?? null,
    },
  } satisfies NormalizedMailbox
}
