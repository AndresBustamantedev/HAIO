import { ConnectorError } from '../errors'
import { googleWorkspaceUsersResponseSchema, type GoogleWorkspaceUserRaw } from './schemas'

const BASE_URL   = 'https://admin.googleapis.com/admin/directory/v1'
const TIMEOUT_MS = 30_000

export class GoogleWorkspaceClient {
  constructor(
    private readonly accessToken: string,
    private readonly customer = 'my_customer',
  ) {}

  async listAllUsers(): Promise<GoogleWorkspaceUserRaw[]> {
    const users: GoogleWorkspaceUserRaw[] = []
    let pageToken: string | undefined

    for (let i = 0; i < 20; i++) {
      const params = new URLSearchParams({
        customer: this.customer,
        maxResults: '500',
        orderBy: 'email',
      })
      if (pageToken) params.set('pageToken', pageToken)

      const data = await this.get(`/users?${params.toString()}`)
      const parsed = googleWorkspaceUsersResponseSchema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Users schema mismatch' })

      users.push(...parsed.data.users)

      pageToken = parsed.data.nextPageToken
      if (!pageToken) break
    }

    return users
  }

  private async get(path: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
