import { createHash } from 'crypto'
import type { NormalizedMailbox } from '../types'
import type { GoogleWorkspaceUserRaw } from './schemas'

export function mapGoogleWorkspaceUser(raw: GoogleWorkspaceUserRaw): NormalizedMailbox {
  const status = raw.suspended ? 'suspended'
    : raw.archived ? 'archived'
    : 'active'

  const hashPayload = { status, orgUnitPath: raw.orgUnitPath, isAdmin: raw.isAdmin }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'mailbox',
    externalId: raw.id,
    externalName: raw.primaryEmail,
    externalStatus: status,
    externalPayloadHash,
    rawMetadata: {
      userId: raw.id,
      primaryEmail: raw.primaryEmail,
      fullName: raw.name?.fullName ?? '',
      givenName: raw.name?.givenName ?? null,
      familyName: raw.name?.familyName ?? null,
      suspended: raw.suspended,
      archived: raw.archived,
      orgUnitPath: raw.orgUnitPath,
      isAdmin: raw.isAdmin,
      isDelegatedAdmin: raw.isDelegatedAdmin,
      creationTime: raw.creationTime,
      lastLoginTime: raw.lastLoginTime ?? null,
    },
  } satisfies NormalizedMailbox
}

export function mapGoogleWorkspaceUsers(raws: ReadonlyArray<GoogleWorkspaceUserRaw>): NormalizedMailbox[] {
  return raws.map(mapGoogleWorkspaceUser)
}
