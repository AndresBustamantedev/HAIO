export type Microsoft365Domain = {
  id: string
  isDefault: boolean
  isVerified: boolean
  isInitial: boolean
  authenticationType: string
}

export type Microsoft365User = {
  id: string
  displayName: string
  userPrincipalName: string
  mail: string | null
  accountEnabled: boolean
  createdDateTime: string | null
  jobTitle: string | null
  department: string | null
}
