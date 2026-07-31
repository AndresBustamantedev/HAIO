import { createHash } from 'crypto'
import { ConnectorError } from '../errors'
import {
  ovhDomainServiceInfoSchema,
  ovhHostingInfoSchema,
  type OvhDomainServiceInfoRaw,
  type OvhHostingInfoRaw,
} from './schemas'

const ENDPOINTS: Record<string, string> = {
  eu: 'https://eu.api.ovh.com/1.0',
  ca: 'https://ca.api.ovh.com/1.0',
  us: 'https://api.us.ovhcloud.com/1.0',
}
const TIMEOUT_MS = 30_000

export class OvhClient {
  private readonly baseUrl: string
  private readonly appKey: string
  private readonly appSecret: string
  private readonly consumerKey: string

  constructor(opts: {
    applicationKey: string
    applicationSecret: string
    consumerKey: string
    endpoint?: string
  }) {
    this.baseUrl = ENDPOINTS[opts.endpoint ?? 'eu'] ?? ENDPOINTS.eu
    this.appKey = opts.applicationKey
    this.appSecret = opts.applicationSecret
    this.consumerKey = opts.consumerKey
  }

  async listDomains(): Promise<string[]> {
    const data = await this.get('/domain')
    if (!Array.isArray(data)) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: '/domain did not return array' })
    return data as string[]
  }

  async getDomainServiceInfo(serviceName: string): Promise<OvhDomainServiceInfoRaw> {
    const data = await this.get(`/domain/${encodeURIComponent(serviceName)}/serviceInfos`)
    const parsed = ovhDomainServiceInfoSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: `serviceInfos schema mismatch for ${serviceName}` })
    return parsed.data
  }

  async listHosting(): Promise<string[]> {
    const data = await this.get('/hosting/web')
    if (!Array.isArray(data)) return []
    return data as string[]
  }

  async getHostingInfo(serviceName: string): Promise<OvhHostingInfoRaw> {
    const data = await this.get(`/hosting/web/${encodeURIComponent(serviceName)}`)
    const parsed = ovhHostingInfoSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: `hosting schema mismatch for ${serviceName}` })
    return parsed.data
  }

  private buildSignature(method: string, url: string, body: string, timestamp: number): string {
    const raw = `${this.appSecret}+${this.consumerKey}+${method}+${url}+${body}+${timestamp}`
    const hash = createHash('sha1').update(raw).digest('hex')
    return `$1$${hash}`
  }

  private async get(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.buildSignature('GET', url, '', timestamp)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        headers: {
          'X-Ovh-Application': this.appKey,
          'X-Ovh-Consumer': this.consumerKey,
          'X-Ovh-Timestamp': String(timestamp),
          'X-Ovh-Signature': signature,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 429) throw new ConnectorError('RATE_LIMITED', { retryable: true })
      if (res.status === 404) throw new ConnectorError('RESOURCE_NOT_FOUND')
      if (res.status >= 500) throw new ConnectorError('PROVIDER_UNAVAILABLE', { retryable: true })
      if (!res.ok) throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', { technicalDetail: `HTTP ${res.status}` })

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
