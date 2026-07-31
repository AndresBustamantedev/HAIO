import { ConnectorError } from '../errors'
import {
  vercelProjectsResponseSchema,
  vercelDeploymentsResponseSchema,
  type VercelProjectRaw,
  type VercelDeploymentRaw,
} from './schemas'

const BASE_URL   = 'https://api.vercel.com'
const TIMEOUT_MS = 30_000
const MAX_DEPLOYMENTS = 100

export class VercelClient {
  private readonly headers: Record<string, string>

  constructor(accessToken: string, private readonly teamId?: string) {
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async getUser(): Promise<{ username: string }> {
    const data = await this.get('/v2/user')
    const user = (data as Record<string, unknown>).user as Record<string, unknown>
    return { username: (user?.username ?? user?.name ?? 'unknown') as string }
  }

  async listAllProjects(): Promise<VercelProjectRaw[]> {
    // v10 devuelve array directo; paginamos con ?from= (continuation token = updatedAt del último)
    const projects: VercelProjectRaw[] = []
    let from: string | undefined

    for (let i = 0; i < 50; i++) {
      const params = new URLSearchParams({ limit: '100' })
      if (from) params.set('from', from)
      if (this.teamId) params.set('teamId', this.teamId)

      const data = await this.get(`/v10/projects?${params}`)
      const parsed = vercelProjectsResponseSchema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Projects schema mismatch' })

      projects.push(...parsed.data)

      // Paginación: si devuelve menos de 100, no hay más páginas
      if (parsed.data.length < 100) break
      // Usa el updatedAt del último proyecto como cursor
      const lastUpdated = parsed.data[parsed.data.length - 1]?.updatedAt
      if (!lastUpdated) break
      from = String(lastUpdated)
    }

    return projects
  }

  async listRecentDeployments(): Promise<VercelDeploymentRaw[]> {
    // v7 es el endpoint documentado actualmente para listar deployments
    const params = new URLSearchParams({ limit: String(MAX_DEPLOYMENTS), state: 'READY' })
    if (this.teamId) params.set('teamId', this.teamId)

    const data = await this.get(`/v7/deployments?${params}`)
    const parsed = vercelDeploymentsResponseSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Deployments schema mismatch' })
    return parsed.data.deployments
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
