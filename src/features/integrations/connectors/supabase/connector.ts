import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { SupabaseManagementClient } from './client'
import { mapSupabaseProjects } from './mapper'

const SUPABASE_CAPABILITIES = new Set<ConnectorCapability>([
  'projects.read',
  'databases.read',
])

export const SUPABASE_META: ConnectorMeta = {
  connectorType: 'supabase',
  displayName: 'Supabase',
  description: 'Sincroniza proyectos de Supabase vía Management API.',
  category: 'Desarrollo',
  status: 'available',
  documentationUrl: 'https://supabase.com/docs/reference/api/introduction',
  requiredSecrets: [
    {
      type: 'access_token',
      label: 'Personal Access Token',
      description: 'Token generado en app.supabase.com → Account → Access Tokens. Empieza por sbp_.',
      isPassword: true,
    },
  ],
  capabilities: SUPABASE_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class SupabaseConnector implements ProviderConnector {
  readonly connectorType = 'supabase'
  readonly capabilities = SUPABASE_CAPABILITIES

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    const accessToken = secrets.get('access_token')
    if (!accessToken) {
      return { success: false, error: new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta access_token.' }) }
    }

    try {
      const client = new SupabaseManagementClient(accessToken)
      await client.listProjects()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const accessToken = context.decryptedSecrets.get('access_token')
    if (!accessToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Missing access_token' })

    const client = new SupabaseManagementClient(accessToken)
    const rawProjects = await client.listProjects()
    const resources = mapSupabaseProjects(rawProjects)

    return { resources }
  }
}
