export type PorkbunDomain = {
  domain: string
  status: string
  tld: string
  createDate: string    // 'YYYY-MM-DD HH:mm:ss'
  expireDate: string    // 'YYYY-MM-DD HH:mm:ss'
  securityLock: string  // '0' | '1'
  whoisPrivacy: string  // '0' | '1'
  autoRenew: string     // '0' | '1'
  notLocal: string      // '0' | '1'
}
