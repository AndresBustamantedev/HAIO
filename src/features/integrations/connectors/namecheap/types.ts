export type NamecheapDomain = {
  id: string
  name: string
  user: string
  created: string    // 'MM/DD/YYYY'
  expires: string    // 'MM/DD/YYYY'
  isExpired: boolean
  isLocked: boolean
  autoRenew: boolean
  whoisGuard: 'ENABLED' | 'NOTPRESENT' | string
  isPremium: boolean
  isOurDNS: boolean
}

export type NamecheapPaging = {
  totalItems: number
  currentPage: number
  pageSize: number
}
