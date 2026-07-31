import { ConnectorError } from '../errors'
import {
  hostingerVMListSchema,
  hostingerDomainListSchema,
  hostingerSubscriptionListSchema,
  hostingerWebsiteListSchema,
  type HostingerVMRaw,
  type HostingerDomainRaw,
  type HostingerSubscriptionRaw,
  type HostingerWebsiteRaw,
} from './schemas'

// URL confirmada desde la documentación interactiva y pruebas en Postman
const BASE_URL = 'https://developers.hostinger.com'
const TIMEOUT_MS = 30_000

export class HostingerClient {
  private readonly headers: Record<string, string>

  constructor(apiToken: string) {
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  async listSubscriptions(): Promise<HostingerSubscriptionRaw[]> {
    const data = await this.get('/api/billing/v1/subscriptions')
    if (data === null) return []
    const list = Array.isArray(data) ? data : (data as Record<string, unknown>)['data'] ?? []
    const parsed = hostingerSubscriptionListSchema.safeParse(list)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Subscription list schema mismatch' })
    return parsed.data
  }

  async listDomains(): Promise<HostingerDomainRaw[]> {
    const data = await this.get('/api/domains/v1/portfolio')
    if (data === null) return []
    const list = Array.isArray(data) ? data : (data as Record<string, unknown>)['data'] ?? []
    const parsed = hostingerDomainListSchema.safeParse(list)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Domain list schema mismatch' })
    return parsed.data
  }

  async listWebsites(): Promise<HostingerWebsiteRaw[]> {
    const data = await this.get('/api/hosting/v1/websites')
    if (data === null) return []
    const list = Array.isArray(data) ? data : (data as Record<string, unknown>)['data'] ?? []
    const parsed = hostingerWebsiteListSchema.safeParse(list)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Website list schema mismatch' })
    return parsed.data
  }

  async listVirtualMachines(): Promise<HostingerVMRaw[]> {
    const data = await this.get('/api/vps/v1/virtual-machines')
    if (data === null) return []
    const list = Array.isArray(data) ? data : (data as Record<string, unknown>)['data'] ?? []
    const parsed = hostingerVMListSchema.safeParse(list)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'VM list schema mismatch' })
    return parsed.data
  }

  private async get(path: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: this.headers,
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 404) return null
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
        throw new ConnectorError('RATE_LIMITED', { retryable: true, retryAfterSeconds: retryAfter })
      }
      if (res.status >= 500) throw new ConnectorError('PROVIDER_UNAVAILABLE', {
        retryable: true,
        technicalDetail: `HTTP ${res.status}`,
      })
      if (!res.ok) throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', { technicalDetail: `HTTP ${res.status}` })

      const contentType = res.headers.get('Content-Type') ?? ''
      if (!contentType.includes('application/json')) {
        throw new ConnectorError('PROVIDER_UNAVAILABLE', {
          technicalDetail: `Non-JSON response (Content-Type: ${contentType})`,
        })
      }

      return await res.json()
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }
}
