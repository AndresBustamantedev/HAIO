export type GoogleWorkspaceUser = {
  id: string
  primaryEmail: string
  name: { fullName: string; givenName?: string; familyName?: string }
  suspended: boolean
  archived: boolean
  creationTime: string
  lastLoginTime: string | null
  orgUnitPath: string
  isAdmin: boolean
  isDelegatedAdmin: boolean
}
