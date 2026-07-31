export type OvhEndpoint = 'eu' | 'ca' | 'us'

export type OvhDomainServiceInfo = {
  serviceId: number
  status: 'ok' | 'expired' | 'inCreation' | 'unrenewed'
  expiration: string      // 'YYYY-MM-DD'
  renew: { automatic: boolean; period: number } | null
}

export type OvhHostingInfo = {
  primaryLogin: string
  offer: string
  state: 'active' | 'bloqued' | 'maintenance'
  hostingIp: string | null
  cluster: string | null
}
