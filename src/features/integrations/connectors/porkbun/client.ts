import { ConnectorError } from '../errors'
import {
  porkbunDomainListResponseSchema,
  porkbunPingResponseSchema,
  type PorkbunDomainRaw,
} from './schemas'

const BASE_URL   = 'https://api.porkbun.com/api/json/v3'
const TIMEOUT_MS = 30_000

export class PorkbunClient {
  constructor(
    private readonly apiKey: string,
    private readonly secretApiKey: string,
  ) {}

  private get authBody(): Record<string, string> {
    return { apikey: this.apiKey, secretapikey: this.secretApiKey }
  }

  async ping(): Promise<string> {
    const data = await this.post('/ping', {})
    const parsed = porkbunPingResponseSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE')
    if (parsed.data.status !== 'SUCCESS') throw new ConnectorError('INVALID_CREDENTIALS')
    return parsed.data.yourIp ?? ''
  }

  async listAllDomains(): Promise<PorkbunDomainRaw[]> {
    const data = await this.post('/domain/listAll', {})
    const parsed = porkbunDomainListResponseSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Domain list schema mismatch' })
    if (parsed.data.status !== 'SUCCESS') throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', { technicalDetail: `status: ${parsed.data.status}` })
    return parsed.data.domains
  }

  private async post(path: string, body: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.authBody, ...body }),
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 429) throw new ConnectorError('RATE_LIMITED', { retryable: true })
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
