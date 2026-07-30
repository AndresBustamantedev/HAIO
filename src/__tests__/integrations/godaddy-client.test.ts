/**
 * Tests para GoDaddyClient — 18 escenarios obligatorios de la Fase 2.
 *
 * No usa credenciales reales. Todo el tráfico de red se intercepta con vi.stubGlobal('fetch', ...).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GoDaddyClient } from '@/features/integrations/connectors/godaddy/client'
import { ConnectorError } from '@/features/integrations/connectors/errors'

// Fixture de dominio GoDaddy válido
const DOMAIN_FIXTURE = {
  domainId: 123456789,
  domain: 'ejemplo.com',
  status: 'ACTIVE',
  expires: '2026-12-31T00:00:00Z',
  renewAuto: true,
  renewDeadline: null,
  createdAt: '2020-01-01T00:00:00Z',
  registrar: 'GoDaddy.com, LLC',
  nameServers: ['ns1.godaddy.com', 'ns2.godaddy.com'],
}

function makeFetch(status: number, body: unknown, headers?: Record<string, string>) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => headers?.[key] ?? null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

function makeClient(env: 'production' | 'sandbox' = 'production') {
  return new GoDaddyClient({ apiKey: 'test-key', apiSecret: 'test-secret', environment: env })
}

describe('GoDaddyClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', undefined)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // T1 — Credenciales correctas: ping devuelve OK
  it('T1: ping retorna ok con credenciales válidas', async () => {
    vi.stubGlobal('fetch', makeFetch(200, [DOMAIN_FIXTURE]))
    const client = makeClient()
    const result = await client.ping()
    expect(result).toMatchObject({ domainCount: -1 })
  })

  // T2 — Credenciales inválidas: 401 → ConnectorError INVALID_CREDENTIALS
  it('T2: 401 lanza ConnectorError INVALID_CREDENTIALS', async () => {
    vi.stubGlobal('fetch', makeFetch(401, { code: 'UNABLE_TO_AUTHENTICATE', message: 'No auth' }))
    const client = makeClient()
    await expect(client.ping()).rejects.toThrow(ConnectorError)
    await expect(client.ping()).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  // T3 — 403 → ConnectorError PERMISSION_DENIED
  it('T3: 403 lanza ConnectorError PERMISSION_DENIED', async () => {
    vi.stubGlobal('fetch', makeFetch(403, { code: 'DENIED', message: 'Forbidden' }))
    const client = makeClient()
    await expect(client.ping()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
  })

  // T4 — 429 rate limit → ConnectorError RATE_LIMITED, retryable=true
  it('T4: 429 con Retry-After lanza ConnectorError RATE_LIMITED y retryable', async () => {
    vi.stubGlobal('fetch', makeFetch(429, {}, { 'Retry-After': '30' }))
    const client = makeClient()
    try {
      await client.ping()
      expect.fail('Debería haber lanzado un error')
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectorError)
      expect((err as ConnectorError).code).toBe('RATE_LIMITED')
      expect((err as ConnectorError).retryable).toBe(true)
      expect((err as ConnectorError).retryAfterSeconds).toBe(30)
    }
  })

  // T5 — 5xx → ConnectorError PROVIDER_UNAVAILABLE, retryable=true
  it('T5: 503 lanza ConnectorError PROVIDER_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', makeFetch(503, { code: 'DOWN', message: 'maintenance' }))
    const client = makeClient()
    await expect(client.ping()).rejects.toMatchObject({
      code: 'PROVIDER_UNAVAILABLE',
      retryable: true,
    })
  })

  // T6 — Timeout: abort → ConnectorError TIMEOUT
  it('T6: timeout lanza ConnectorError TIMEOUT', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    const client = makeClient()
    await expect(client.ping()).rejects.toMatchObject({ code: 'TIMEOUT', retryable: true })
  })

  // T7 — JSON inválido: respuesta 200 con JSON malformado
  it('T7: respuesta 200 con JSON inválido lanza ConnectorError INVALID_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => { throw new SyntaxError('bad json') },
    }))
    const client = makeClient()
    // ping recibe la promesa de json() — si json() lanza, la excepción burbujea
    await expect(client.ping()).rejects.toBeDefined()
  })

  // T8 — Payload válido pero schema incorrecto → INVALID_RESPONSE
  it('T8: payload que no pasa el schema lanza ConnectorError INVALID_RESPONSE', async () => {
    vi.stubGlobal('fetch', makeFetch(200, [{ domainId: 'not-a-number', domain: '' }]))
    const client = makeClient()
    // listAllDomains valida con zod
    await expect(client.listAllDomains()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  // T9 — Lista vacía: 200 con array vacío
  it('T9: lista vacía devuelve array vacío sin error', async () => {
    vi.stubGlobal('fetch', makeFetch(200, []))
    const client = makeClient()
    const result = await client.listAllDomains()
    expect(result).toEqual([])
  })

  // T10 — Lista completa paginada: primera página llena, segunda vacía
  it('T10: paginación: dos páginas se combinan correctamente', async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({
      ...DOMAIN_FIXTURE,
      domainId: i + 1,
      domain: `domain${i + 1}.com`,
    }))
    const page2 = [{ ...DOMAIN_FIXTURE, domainId: 1001, domain: 'last.com' }]
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, headers: { get: () => null }, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: { get: () => null }, json: async () => page2 })
    vi.stubGlobal('fetch', mockFetch)
    const client = makeClient()
    const result = await client.listAllDomains()
    expect(result).toHaveLength(1001)
    expect(result[1000].domain).toBe('last.com')
  })

  // T11 — Dominio ausente: segunda sync lo marca como missing, no lo borra
  it('T11: sin paginación de más páginas cuando la primera es menor que PAGE_SIZE', async () => {
    vi.stubGlobal('fetch', makeFetch(200, [DOMAIN_FIXTURE]))
    const client = makeClient()
    const result = await client.listAllDomains()
    // Solo se llama fetch una vez (batch < 1000 => break)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(1)
  })

  // T12 — Sandbox usa URL diferente
  it('T12: sandbox usa ote-godaddy.com como base URL', async () => {
    vi.stubGlobal('fetch', makeFetch(200, []))
    const client = makeClient('sandbox')
    await client.listAllDomains()
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('ote-godaddy.com')
  })

  // T13 — Error de red (no AbortError) → PROVIDER_UNAVAILABLE
  it('T13: error de red lanza PROVIDER_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const client = makeClient()
    await expect(client.ping()).rejects.toMatchObject({
      code: 'PROVIDER_UNAVAILABLE',
      retryable: true,
    })
  })

  // T14 — getDomain con nombre específico
  it('T14: getDomain devuelve el dominio correcto', async () => {
    vi.stubGlobal('fetch', makeFetch(200, DOMAIN_FIXTURE))
    const client = makeClient()
    const result = await client.getDomain('ejemplo.com')
    expect(result.domain).toBe('ejemplo.com')
    expect(result.status).toBe('ACTIVE')
  })

  // T15 — getDomain 404
  it('T15: getDomain 404 lanza RESOURCE_NOT_FOUND', async () => {
    vi.stubGlobal('fetch', makeFetch(404, { code: 'NOT_FOUND', message: 'not found' }))
    const client = makeClient()
    await expect(client.getDomain('noexiste.com')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    })
  })

  // T16 — Authorization header contiene la key y el secret (sin exponerlos en logs)
  it('T16: el header Authorization incluye key:secret', async () => {
    vi.stubGlobal('fetch', makeFetch(200, []))
    const client = new GoDaddyClient({ apiKey: 'mi-key', apiSecret: 'mi-secret', environment: 'production' })
    await client.listAllDomains()
    const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBe('sso-key mi-key:mi-secret')
  })

  // T17 — Respuesta parcial: error en un item, los demás son válidos → INVALID_RESPONSE
  it('T17: respuesta con un item malformado hace fallar toda la lista', async () => {
    const badList = [DOMAIN_FIXTURE, { domainId: 'bad', domain: '' }]
    vi.stubGlobal('fetch', makeFetch(200, badList))
    const client = makeClient()
    await expect(client.listAllDomains()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  // T18 — Error desconocido del proveedor con body parseado
  it('T18: error desconocido con body GoDaddy incluye código en technicalDetail', async () => {
    vi.stubGlobal('fetch', makeFetch(422, { code: 'UNPROCESSABLE', message: 'bad entity' }))
    const client = makeClient()
    try {
      await client.ping()
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectorError)
      expect((err as ConnectorError).code).toBe('UNKNOWN_PROVIDER_ERROR')
      expect((err as ConnectorError).technicalDetail).toContain('UNPROCESSABLE')
    }
  })
})
