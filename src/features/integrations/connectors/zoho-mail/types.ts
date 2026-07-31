export type ZohoMailAccount = {
  accountId: string
  accountName: string
  displayName: string
  incomingUserName: string
  mailCapacity: number
  mailUsed: number
  accountStatus: string
  isPrimary: boolean
}

export type ZohoMailEmailAddress = {
  mailId: string
  isPrimary: boolean
  isSendMail: boolean
  displayName: string
}
