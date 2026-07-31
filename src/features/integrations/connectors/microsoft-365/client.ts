import { ConnectorError } from '../errors'
import {
  ms365DomainsResponseSchema,
  ms365UsersResponseSchema,
  type Ms365DomainRaw,
  type Ms365UserRaw,
} from './schemas'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const TOKEN_BASE = 'https://login.microsoftonline.com'
const TIMEOUT_MS = 30_000

export class Microsoft365Client {
  private accessToken: string | null = null

  constructor(
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  private async ensureToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const body = new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      scope:         'https://graph.microsoft.com/.default',
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${TOKEN_BASE}/${this.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 400) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'OAuth token request failed.' })
      if (!res.ok) throw new ConnectorError('PROVIDER_UNAVAILABLE')

      const data = await res.json() as Record<string, unknown>
      if (!data.access_token) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'No access_token in response.' })
      this.accessToken = data.access_token as string
      return this.accessToken
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }

  async listDomains(): Promise<Ms365DomainRaw[]> {
    const token = await this.ensureToken()
    const data = await this.get('/domains', token)
    const parsed = ms365DomainsResponseSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Domains schema mismatch' })
    return parsed.data.value
  }

  async listAllUsers(): Promise<Ms365UserRaw[]> {
    const token = await this.ensureToken()
    const users: Ms365UserRaw[] = []
    let url: string | undefined = `/users?$top=999&$select=id,displayName,userPrincipalName,mail,accountEnabled,createdDateTime,jobTitle,department`

    while (url) {
      const data = await this.get(url, token)
      const parsed = ms365UsersResponseSchema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Users schema mismatch' })
      users.push(...parsed.data.value)
      url = parsed.data['@odata.nextLink']
        ? parsed.data['@odata.nextLink'].replace(GRAPH_BASE, '')
        : undefined
    }

    return users
  }

  private async get(path: string, token: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      if (res.status === 401) { this.accessToken = null; throw new ConnectorError('INVALID_CREDENTIALS') }
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
