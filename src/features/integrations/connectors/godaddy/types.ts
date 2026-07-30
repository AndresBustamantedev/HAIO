/**
 * Tipos específicos de la API de GoDaddy v1.
 * Solo se usan internamente en el conector — nunca se exponen al resto de la app.
 */

export type GoDaddyDomainStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'
  | 'HELD'
  | 'LOCKED'
  | 'PARKED'
  | 'PENDING'
  | 'RESERVED'
  | 'REVERTED'
  | 'SUSPENDED'
  | 'TRANSFERRED_IN_CANCELLATION'
  | 'TRANSFERRED_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_IN_RESTART'
  | 'TRANSFER_IN_REVIEW'
  | 'UNKNOWN'
  | 'UNVERIFIED'

export type GoDaddyDomain = {
  domainId: number
  domain: string
  status: GoDaddyDomainStatus
  expires: string | null            // ISO 8601
  renewAuto: boolean
  renewDeadline: string | null
  createdAt: string
  registrar?: string
  nameServers: string[] | null
  contactRegistrant?: {
    email?: string
  }
}

export type GoDaddyAccountInfo = {
  // La API de GoDaddy no tiene un endpoint dedicado de "cuenta".
  // Se obtiene haciendo GET /v1/domains?limit=1 y verificando que responde 200.
  // El nombre de la cuenta se infiere del dominio de contacto si está disponible.
  domainCount?: number
}

export type GoDaddyListDomainsResponse = GoDaddyDomain[]

export type GoDaddyErrorResponse = {
  code: string
  message: string
  fields?: Array<{ code: string; message: string; path: string }>
}

export type GoDaddyConfig = {
  apiKey: string
  apiSecret: string
  environment: 'production' | 'sandbox'
}
