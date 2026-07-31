import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult, NormalizedResource } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { Microsoft365Client } from './client'
import { mapMs365Domain, mapMs365User } from './mapper'

const MS365_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'mailboxes.read',
  'users.read',
])

export const MICROSOFT_365_META: ConnectorMeta = {
  connectorType: 'microsoft-365',
  displayName: 'Microsoft 365',
  description: 'Sincroniza dominios y usuarios de Microsoft 365 vía Microsoft Graph API.',
  category: 'Email',
  status: 'setup_required',
  documentationUrl: 'https://learn.microsoft.com/en-us/graph/overview',
  setupInstructions: [
    'Registra una aplicación en Azure Active Directory (portal.azure.com → App registrations).',
    'Concede permisos de aplicación: Domain.Read.All y User.Read.All (no delegados — requieren consentimiento del administrador).',
    'Crea un Client Secret en la sección "Certificates & secrets" de la aplicación.',
    'El administrador de M365 debe conceder el consentimiento de administrador a la aplicación.',
  ],
  requiredSecrets: [
    {
      type: 'tenant_id',
      label: 'Tenant ID',
      description: 'ID del directorio de Azure Active Directory (visible en portal.azure.com).',
      isPassword: false,
    },
    {
      type: 'client_id',
      label: 'Client ID (App ID)',
      description: 'ID de la aplicación registrada en Azure AD con permisos Domain.Read.All y User.Read.All.',
      isPassword: false,
    },
    {
      type: 'client_secret',
      label: 'Client Secret',
      description: 'Secreto de la aplicación registrada en Azure AD.',
      isPassword: true,
    },
  ],
  capabilities: MS365_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class Microsoft365Connector implements ProviderConnector {
  readonly connectorType = 'microsoft-365'
  readonly capabilities = MS365_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): Microsoft365Client {
    const tenantId     = secrets.get('tenant_id')
    const clientId     = secrets.get('client_id')
    const clientSecret = secrets.get('client_secret')

    if (!tenantId || !clientId || !clientSecret) {
      throw new ConnectorError('INVALID_CREDENTIALS', {
        technicalDetail: 'Faltan tenant_id, client_id o client_secret.',
      })
    }

    return new Microsoft365Client(tenantId, clientId, clientSecret)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      await client.listDomains()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets)
    const resources: NormalizedResource[] = []

    const [rawDomains, rawUsers] = await Promise.all([
      client.listDomains(),
      client.listAllUsers(),
    ])

    resources.push(...rawDomains.map(mapMs365Domain))
    resources.push(...rawUsers.map(mapMs365User))

    return { resources }
  }
}
