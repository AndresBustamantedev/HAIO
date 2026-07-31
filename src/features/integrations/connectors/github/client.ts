import { ConnectorError } from '../errors'
import { githubRepoListSchema, type GitHubRepoRaw } from './schemas'

const BASE_URL   = 'https://api.github.com'
const TIMEOUT_MS = 30_000
const PAGE_SIZE  = 100

export class GitHubClient {
  private readonly headers: Record<string, string>

  constructor(accessToken: string) {
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HAIO-Integration/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  async getUser(): Promise<{ login: string; name: string | null }> {
    const data = await this.get('/user')
    const user = data as Record<string, unknown>
    return { login: user.login as string, name: (user.name as string | null) ?? null }
  }

  async listAllRepos(): Promise<GitHubRepoRaw[]> {
    const repos: GitHubRepoRaw[] = []
    let page = 1

    while (true) {
      const data = await this.get(
        `/user/repos?per_page=${PAGE_SIZE}&page=${page}&type=all&sort=updated`,
      )
      const parsed = githubRepoListSchema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Repo list schema mismatch' })

      repos.push(...parsed.data)
      if (parsed.data.length < PAGE_SIZE) break
      page++
    }

    return repos
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
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10)
        throw new ConnectorError('RATE_LIMITED', { retryable: true, retryAfterSeconds: retryAfter })
      }
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
