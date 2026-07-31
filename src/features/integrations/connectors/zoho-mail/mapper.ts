import { createHash } from 'crypto'
import type { NormalizedMailService } from '../types'
import type { ZohoMailAccountRaw } from './schemas'

export function mapZohoMailAccount(raw: ZohoMailAccountRaw): NormalizedMailService {
  const hashPayload = { accountStatus: raw.accountStatus, mailCapacity: raw.mailCapacity }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'mail_service',
    externalId: raw.accountId,
    externalName: raw.accountName,
    externalStatus: raw.accountStatus,
    externalPayloadHash,
    rawMetadata: {
      accountId: raw.accountId,
      accountName: raw.accountName,
      displayName: raw.displayName,
      incomingUserName: raw.incomingUserName,
      mailCapacityMb: raw.mailCapacity,
      mailUsedMb: raw.mailUsed,
      accountStatus: raw.accountStatus,
      isPrimary: raw.isPrimary,
    },
  } satisfies NormalizedMailService
}

export function mapZohoMailAccounts(raws: ReadonlyArray<ZohoMailAccountRaw>): NormalizedMailService[] {
  return raws.map(mapZohoMailAccount)
}
