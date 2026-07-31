import { ConnectorError } from '../errors'
import {
  cloudflareZonesResponseSchema,
  cloudflareTokenVerifySchema,
  type CloudflareZoneRaw,
} from './schemas'

const BASE_URL = 'https://api.cloudflare.com/client/v4'
const TIMEOUT_MS = 30_000
const PAGE_SIZE = 1000
const MAX_PAGES = 20

export class CloudflareClient {
  private readonly headers: Record<string, string>

  constructor(apiToken: string) {
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  async verifyToken(): Promise<{ id: string; status: string }> {
    const data = await this.get('/user/tokens/verify')
    const parsed = cloudflareTokenVerifySchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Token verify schema mismatch' })
    if (!parsed.data.success) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Token verify returned success:false' })
    return parsed.data.result
  }

  async listAllZones(): Promise<CloudflareZoneRaw[]> {
    const zones: CloudflareZoneRaw[] = []
    let page = 1

    for (let i = 0; i < MAX_PAGES; i++) {
      const data = await this.get(`/zones?per_page=${PAGE_SIZE}&page=${page}`)
      const parsed = cloudflareZonesResponseSchema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: `Zones page ${page} schema mismatch` })
      if (!parsed.data.success) {
        const msg = parsed.data.errors[0]?.message ?? 'Unknown error'
        throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', { technicalDetail: msg })
      }

      zones.push(...parsed.data.result)

      const info = parsed.data.result_info
      if (!info || page >= info.total_pages) break
      page++
    }

    return zones
  }

  private async get(path: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: this.headers,
        signal: controller.signal,
      })

      if (res.status === 401) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 403) throw new ConnectorError('PERMISSION_DENIED')
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
        throw new ConnectorError('RATE_LIMITED', { retryable: true, retryAfterSeconds: retryAfter })
      }
      if (res.status >= 500) throw new ConnectorError('PROVIDER_UNAVAILABLE', { retryable: true })

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
