import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult, NormalizedResource } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { VercelClient } from './client'
import { mapVercelProject, mapVercelDeployment } from './mapper'

const VERCEL_CAPABILITIES = new Set<ConnectorCapability>([
  'projects.read',
  'deployments.read',
])

export const VERCEL_META: ConnectorMeta = {
  connectorType: 'vercel',
  displayName: 'Vercel',
  description: 'Sincroniza proyectos y despliegues de Vercel.',
  category: 'Desarrollo',
  status: 'available',
  documentationUrl: 'https://vercel.com/docs/rest-api',
  requiredSecrets: [
    {
      type: 'access_token',
      label: 'Access Token',
      description: 'Token de acceso personal generado en vercel.com → Settings → Tokens.',
      isPassword: true,
    },
    {
      type: 'team_id',
      label: 'Team ID',
      description: 'ID del equipo Vercel (empieza por "team_"). Déjalo vacío para sincronizar tu cuenta personal.',
      isPassword: false,
      optional: true,
    },
  ],
  capabilities: VERCEL_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class VercelConnector implements ProviderConnector {
  readonly connectorType = 'vercel'
  readonly capabilities = VERCEL_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): VercelClient {
    const accessToken = secrets.get('access_token')
    if (!accessToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta access_token.' })
    const teamId = secrets.get('team_id') || undefined
    return new VercelClient(accessToken, teamId)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      const user = await client.getUser()
      return { success: true, accountName: user.username }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets)
    const resources: NormalizedResource[] = []

    const [rawProjects, rawDeployments] = await Promise.all([
      client.listAllProjects(),
      client.listRecentDeployments(),
    ])

    resources.push(...rawProjects.map(mapVercelProject))
    resources.push(...rawDeployments.map(mapVercelDeployment))

    return { resources }
  }
}
