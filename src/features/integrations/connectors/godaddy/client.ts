import { ConnectorError } from '../errors'
import type { GoDaddyConfig } from './types'
import {
  goDaddyDomainsListSchema,
  goDaddyErrorSchema,
  type GoDaddyDomainRaw,
} from './schemas'

const BASE_URLS = {
  production: 'https://api.godaddy.com',
  sandbox: 'https://api.ote-godaddy.com',
} as const

const DEFAULT_TIMEOUT_MS = 30_000
const PAGE_SIZE = 1000  // Máximo permitido por GoDaddy v1
const MAX_PAGES = 50    // Límite de seguridad: 50.000 dominios máximo por cuenta

/**
 * Cliente HTTP para la API de GoDaddy v1.
 * Gestiona paginación, rate limiting y errores normalizados.
 * No persiste datos ni loguea secretos.
 */
export class GoDaddyClient {
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(private readonly config: GoDaddyConfig) {
    this.baseUrl = BASE_URLS[config.environment]
    this.authHeader = `sso-key ${config.apiKey}:${config.apiSecret}`
  }

  /**
   * GET /v1/domains
   * Devuelve todos los dominios de la cuenta paginando internamente.
   * Respeta el header Retry-After en caso de 429.
   */
  async listAllDomains(): Promise<GoDaddyDomainRaw[]> {
    const all: GoDaddyDomainRaw[] = []
    let marker: string | undefined = undefined
    let page = 0

    while (page < MAX_PAGES) {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        includes: 'nameServers',
      })
      if (marker) params.set('marker', marker)

      const response = await this.request<unknown>(
        `/v1/domains?${params.toString()}`,
      )

      const parsed = goDaddyDomainsListSchema.safeParse(response)
      if (!parsed.success) {
        throw new ConnectorError('INVALID_RESPONSE', {
          technicalDetail: `Error al parsear lista de dominios: ${parsed.error.message.slice(0, 300)}`,
        })
      }

      const batch = parsed.data
      all.push(...batch)

      // GoDaddy no usa paginación por cursor en v1 — devuelve todos los dominios
      // o un subconjunto. Si la respuesta tiene menos de PAGE_SIZE, hemos terminado.
      if (batch.length < PAGE_SIZE) break

      // Si hay exactamente PAGE_SIZE, puede haber más. Usar el último domainId como marker.
      const lastId = batch[batch.length - 1]?.domainId
      if (lastId === undefined) break
      marker = String(lastId)
      page++
    }

    return all
  }

  /**
   * GET /v1/domains/{domain}
   * Obtiene el detalle de un dominio específico.
   */
  async getDomain(domainName: string): Promise<GoDaddyDomainRaw> {
    const response = await this.request<unknown>(`/v1/domains/${encodeURIComponent(domainName)}`)

    const parsed = goDaddyDomainsListSchema.element.safeParse(response)
    if (!parsed.success) {
      throw new ConnectorError('INVALID_RESPONSE', {
        technicalDetail: `Error al parsear dominio ${domainName}: ${parsed.error.message.slice(0, 200)}`,
      })
    }
    return parsed.data
  }

  /**
   * Verifica la conexión obteniendo 1 dominio (el mínimo posible).
   * Devuelve el número total de dominios si la API lo expone.
   */
  async ping(): Promise<{ domainCount: number }> {
    const response = await this.request<GoDaddyDomainRaw[]>('/v1/domains?limit=1')

    if (!Array.isArray(response)) {
      throw new ConnectorError('INVALID_RESPONSE', {
        technicalDetail: 'La respuesta de /v1/domains no es un array.',
      })
    }

    // GoDaddy no expone el total en headers estándar; usamos el count como estimado
    return { domainCount: -1 }  // -1 = desconocido
  }

  // ── Método interno ──────────────────────────────────────────────────────────

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ConnectorError('TIMEOUT', { retryable: true })
      }
      throw new ConnectorError('PROVIDER_UNAVAILABLE', {
        technicalDetail: `Fetch error: ${err instanceof Error ? err.message.slice(0, 100) : 'unknown'}`,
        retryable: true,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (response.ok) {
      return response.json() as Promise<T>
    }

    return this.handleErrorResponse(response)
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    // Rate limit
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new ConnectorError('RATE_LIMITED', {
        retryable: true,
        retryAfterSeconds: retryAfter ? parseInt(retryAfter, 10) : 60,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new ConnectorError(
        response.status === 401 ? 'INVALID_CREDENTIALS' : 'PERMISSION_DENIED',
      )
    }

    if (response.status === 404) {
      throw new ConnectorError('RESOURCE_NOT_FOUND')
    }

    if (response.status >= 500) {
      throw new ConnectorError('PROVIDER_UNAVAILABLE', {
        retryable: true,
        technicalDetail: `HTTP ${response.status}`,
      })
    }

    // Otros errores: intentar parsear el cuerpo del error de GoDaddy
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
        technicalDetail: `HTTP ${response.status}`,
      })
    }

    const parsed = goDaddyErrorSchema.safeParse(body)
    if (parsed.success) {
      throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
        technicalDetail: `[${parsed.data.code}] ${parsed.data.message.slice(0, 200)}`,
      })
    }

    throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
      technicalDetail: `HTTP ${response.status}`,
    })
  }
}
