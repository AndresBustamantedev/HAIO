/**
 * Tests para el mapper GoDaddy → NormalizedDomain.
 * Verifica que no se inventan datos y que el hash es estable.
 */
import { describe, it, expect } from 'vitest'
import { mapGoDaddyDomain, mapGoDaddyDomains } from '@/features/integrations/connectors/godaddy/mapper'

const BASE_RAW = {
  domainId: 1,
  domain: 'ejemplo.com',
  status: 'ACTIVE',
  expires: '2026-06-30T00:00:00Z',
  renewAuto: true,
  renewDeadline: null,
  createdAt: '2020-01-01T00:00:00Z',
  registrar: 'GoDaddy.com, LLC',
  nameServers: ['NS1.GODADDY.COM', 'NS2.GODADDY.COM'],
}

describe('mapGoDaddyDomain', () => {
  it('mapea status ACTIVE → active', () => {
    const d = mapGoDaddyDomain(BASE_RAW)
    expect(d.status).toBe('active')
  })

  it('mapea status EXPIRED → expired', () => {
    const d = mapGoDaddyDomain({ ...BASE_RAW, status: 'EXPIRED' })
    expect(d.status).toBe('expired')
  })

  it('mapea status desconocido → unknown', () => {
    const d = mapGoDaddyDomain({ ...BASE_RAW, status: 'WEIRD_STATUS' })
    expect(d.status).toBe('unknown')
  })

  it('normaliza nameservers a minúsculas y sin punto final', () => {
    const d = mapGoDaddyDomain(BASE_RAW)
    expect(d.nameservers).toEqual(['ns1.godaddy.com', 'ns2.godaddy.com'])
  })

  it('el externalId es el domainName en minúsculas', () => {
    const d = mapGoDaddyDomain({ ...BASE_RAW, domain: 'EJEMPLO.COM' })
    expect(d.externalId).toBe('ejemplo.com')
    expect(d.domainName).toBe('ejemplo.com')
  })

  it('expiresOn es null cuando expires es null', () => {
    const d = mapGoDaddyDomain({ ...BASE_RAW, expires: null })
    expect(d.expiresOn).toBeNull()
  })

  it('rawMetadata no contiene contraseñas ni secretos', () => {
    const d = mapGoDaddyDomain(BASE_RAW)
    const meta = JSON.stringify(d.rawMetadata)
    expect(meta).not.toContain('api_key')
    expect(meta).not.toContain('api_secret')
    expect(meta).not.toContain('password')
  })

  it('el hash cambia cuando status cambia', () => {
    const d1 = mapGoDaddyDomain({ ...BASE_RAW, status: 'ACTIVE' })
    const d2 = mapGoDaddyDomain({ ...BASE_RAW, status: 'EXPIRED' })
    expect(d1.externalPayloadHash).not.toBe(d2.externalPayloadHash)
  })

  it('el hash es estable con los mismos datos', () => {
    const d1 = mapGoDaddyDomain(BASE_RAW)
    const d2 = mapGoDaddyDomain(BASE_RAW)
    expect(d1.externalPayloadHash).toBe(d2.externalPayloadHash)
  })

  it('mapGoDaddyDomains mapea un array', () => {
    const result = mapGoDaddyDomains([BASE_RAW, { ...BASE_RAW, domainId: 2, domain: 'otro.com' }])
    expect(result).toHaveLength(2)
    expect(result[1].domainName).toBe('otro.com')
  })
})
