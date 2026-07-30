import { createHash } from 'crypto'
import type { NormalizedDomain } from '../types'
import type { GoDaddyDomainRaw } from './schemas'

/**
 * Mapea la respuesta cruda de GoDaddy al tipo normalizado de HAIO.
 *
 * Reglas:
 * - No inventar datos que la API no proporciona (p.ej. costes).
 * - externalPayloadHash se calcula sobre los campos que pueden cambiar
 *   para detectar actualizaciones entre syncs.
 * - rawMetadata incluye el payload original sin campos sensibles.
 */
export function mapGoDaddyDomain(raw: GoDaddyDomainRaw): NormalizedDomain {
  const normalizedNameservers = (raw.nameServers ?? [])
    .map((ns) => ns.toLowerCase().replace(/\.$/, ''))
    .sort()

  const expiresOn = raw.expires ? parseDate(raw.expires) : null

  const status = mapDomainStatus(raw.status)

  // Payload normalizado para el hash — solo los campos que pueden cambiar.
  // Ordenado de forma determinista para que el hash sea estable.
  const hashPayload = {
    status,
    expiresOn: expiresOn?.toISOString() ?? null,
    autoRenew: raw.renewAuto,
    nameservers: normalizedNameservers,
  }

  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'domain',
    externalId: raw.domain.toLowerCase(),
    domainName: raw.domain.toLowerCase(),
    status,
    expiresOn,
    autoRenew: raw.renewAuto,
    nameservers: normalizedNameservers,
    registrarName: raw.registrar ?? null,
    externalPayloadHash,
    rawMetadata: {
      domainId: raw.domainId,
      domain: raw.domain,
      status: raw.status,
      expires: raw.expires,
      renewAuto: raw.renewAuto,
      renewDeadline: raw.renewDeadline,
      createdAt: raw.createdAt,
      registrar: raw.registrar,
      // nameServers se normaliza en el campo propio; aquí el original para referencia
      nameServers: raw.nameServers,
    },
  } satisfies NormalizedDomain
}

export function mapGoDaddyDomains(
  raws: ReadonlyArray<GoDaddyDomainRaw>,
): NormalizedDomain[] {
  return raws.map(mapGoDaddyDomain)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapDomainStatus(
  raw: string,
): NormalizedDomain['status'] {
  switch (raw.toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'EXPIRED':
      return 'expired'
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled'
    case 'TRANSFERRED_OUT':
    case 'TRANSFER_IN':
    case 'TRANSFER_IN_RESTART':
    case 'TRANSFER_IN_REVIEW':
      return 'transferred'
    case 'PENDING':
    case 'HELD':
    case 'UNVERIFIED':
      return 'pending'
    default:
      return 'unknown'
  }
}

function parseDate(iso: string): Date | null {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}
