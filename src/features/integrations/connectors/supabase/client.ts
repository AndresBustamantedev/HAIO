import { ConnectorError } from '../errors'
import { supabaseProjectListSchema, type SupabaseProjectRaw } from './schemas'

const BASE_URL   = 'https://api.supabase.com'
const TIMEOUT_MS = 30_000

export class SupabaseManagementClient {
  private readonly headers: Record<string, string>

  constructor(accessToken: string) {
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async listProjects(): Promise<SupabaseProjectRaw[]> {
    const data = await this.get('/v1/projects')
    const parsed = supabaseProjectListSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Projects list schema mismatch' })
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
