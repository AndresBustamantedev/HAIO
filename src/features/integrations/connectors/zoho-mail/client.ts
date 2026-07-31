import { ConnectorError } from '../errors'
import { zohoMailAccountsResponseSchema, type ZohoMailAccountRaw } from './schemas'

const REGION_BASE: Record<string, string> = {
  com:    'https://mail.zoho.com/api',
  eu:     'https://mail.zoho.eu/api',
  in:     'https://mail.zoho.in/api',
  'com.au': 'https://mail.zoho.com.au/api',
  jp:     'https://mail.zoho.jp/api',
}
const TIMEOUT_MS = 30_000

export class ZohoMailClient {
  private readonly baseUrl: string

  constructor(
    private readonly accessToken: string,
    region = 'com',
  ) {
    this.baseUrl = REGION_BASE[region] ?? REGION_BASE.com
  }

  async listAccounts(): Promise<ZohoMailAccountRaw[]> {
    const data = await this.get('/accounts')
    const parsed = zohoMailAccountsResponseSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Accounts schema mismatch' })
    return parsed.data.data
  }

  private async get(path: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      if (res.status === 401) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 403) throw new ConnectorError('PERMISSION_DENIED')
      if (res.status === 429) throw new ConnectorError('RATE_LIMITED', { retryable: true })
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
