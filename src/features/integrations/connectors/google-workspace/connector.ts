import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { GoogleWorkspaceClient } from './client'
import { mapGoogleWorkspaceUsers } from './mapper'

const GOOGLE_WORKSPACE_CAPABILITIES = new Set<ConnectorCapability>([
  'mailboxes.read',
  'users.read',
])

export const GOOGLE_WORKSPACE_META: ConnectorMeta = {
  connectorType: 'google-workspace',
  displayName: 'Google Workspace',
  description: 'Sincroniza buzones y usuarios de Google Workspace (Admin SDK).',
  category: 'Email',
  status: 'setup_required',
  documentationUrl: 'https://developers.google.com/admin-sdk/directory/v1/guides/manage-users',
  setupInstructions: [
    'Necesitas una cuenta de administrador de Google Workspace.',
    'El Access Token OAuth debe tener el scope https://www.googleapis.com/auth/admin.directory.user.readonly.',
    'El token expira en 1 hora — rótalo con el Refresh Token antes de cada sincronización.',
    'Opcionalmente usa una Service Account con delegación a nivel de dominio para evitar la expiración.',
  ],
  requiredSecrets: [
    {
      type: 'access_token',
      label: 'Access Token OAuth 2.0',
      description: 'Token OAuth con scope admin.directory.user.readonly. Obtenido via OAuth 2.0 o Service Account.',
      isPassword: true,
    },
    {
      type: 'customer',
      label: 'Customer ID (opcional)',
      description: 'ID del cliente de Google Workspace. Por defecto: my_customer.',
      isPassword: false,
    },
  ],
  capabilities: GOOGLE_WORKSPACE_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class GoogleWorkspaceConnector implements ProviderConnector {
  readonly connectorType = 'google-workspace'
  readonly capabilities = GOOGLE_WORKSPACE_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): GoogleWorkspaceClient {
    const accessToken = secrets.get('access_token')
    if (!accessToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta access_token.' })
    const customer = secrets.get('customer') || 'my_customer'
    return new GoogleWorkspaceClient(accessToken, customer)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      // Listamos 1 usuario como test de conexión
      await client.listAllUsers()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets)
    const rawUsers = await client.listAllUsers()
    const resources = mapGoogleWorkspaceUsers(rawUsers)

    return { resources }
  }
}
