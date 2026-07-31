import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { GitHubClient } from './client'
import { mapGitHubRepos } from './mapper'

const GITHUB_CAPABILITIES = new Set<ConnectorCapability>([
  'repositories.read',
])

export const GITHUB_META: ConnectorMeta = {
  connectorType: 'github',
  displayName: 'GitHub',
  description: 'Sincroniza repositorios de GitHub accesibles con el token.',
  category: 'Desarrollo',
  status: 'available',
  documentationUrl: 'https://docs.github.com/en/rest',
  requiredSecrets: [
    {
      type: 'access_token',
      label: 'Personal Access Token',
      description: 'Token clásico o fine-grained con permiso repo:read o contents:read.',
      isPassword: true,
    },
  ],
  capabilities: GITHUB_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class GitHubConnector implements ProviderConnector {
  readonly connectorType = 'github'
  readonly capabilities = GITHUB_CAPABILITIES

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    const accessToken = secrets.get('access_token')
    if (!accessToken) {
      return { success: false, error: new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta access_token.' }) }
    }

    try {
      const client = new GitHubClient(accessToken)
      const user = await client.getUser()
      return { success: true, accountName: user.login }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const accessToken = context.decryptedSecrets.get('access_token')
    if (!accessToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Missing access_token' })

    const client = new GitHubClient(accessToken)
    const rawRepos = await client.listAllRepos()
    const resources = mapGitHubRepos(rawRepos)

    return { resources }
  }
}
