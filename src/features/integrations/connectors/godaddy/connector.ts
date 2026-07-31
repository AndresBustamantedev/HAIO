import type {
  ProviderConnector,
  ConnectorMeta,
  ConnectorCapability,
  SyncContext,
  ConnectionTestResult,
} from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { GoDaddyClient } from './client'
import { mapGoDaddyDomains } from './mapper'

/**
 * Capacidades reales de la API de GoDaddy v1.
 * Solo se declaran las que la API realmente proporciona.
 * GoDaddy no expone: hosting.read, email.read, billing.read
 */
const GODADDY_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'domains.expiration',
  'domains.autorenew',
  'domains.nameservers',
])

export const GODADDY_META: ConnectorMeta = {
  connectorType: 'godaddy',
  displayName: 'GoDaddy',
  description: 'Sincroniza dominios registrados en GoDaddy via API v1.',
  category: 'Dominios y DNS',
  status: 'available',
  documentationUrl: 'https://developer.godaddy.com/doc/endpoint/domains',
  requiredSecrets: [
    {
      type: 'api_key',
      label: 'API Key',
      description: 'Clave de producción o sandbox obtenida en developer.godaddy.com.',
      isPassword: false,
    },
    {
      type: 'api_secret',
      label: 'API Secret',
      description: 'Secreto asociado a la API Key.',
      isPassword: true,
    },
  ],
  capabilities: GODADDY_CAPABILITIES,
  supportedEnvironments: ['production', 'sandbox'],
}

/**
 * Conector de GoDaddy. Stateless — cualquier estado de sesión
 * vive en SyncContext o en las credenciales cifradas de la DB.
 */
export class GoDaddyConnector implements ProviderConnector {
  readonly connectorType = 'godaddy'
  readonly capabilities = GODADDY_CAPABILITIES

  async testConnection(
    secrets: ReadonlyMap<string, string>,
    environment: 'production' | 'sandbox',
  ): Promise<ConnectionTestResult> {
    const apiKey = secrets.get('api_key')
    const apiSecret = secrets.get('api_secret')

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        error: new ConnectorError('INVALID_CREDENTIALS', {
          technicalDetail: 'Faltan api_key o api_secret en los secrets proporcionados.',
        }),
      }
    }

    const client = new GoDaddyClient({ apiKey, apiSecret, environment })

    try {
      await client.ping()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const apiKey = context.decryptedSecrets.get('api_key')
    const apiSecret = context.decryptedSecrets.get('api_secret')

    if (!apiKey || !apiSecret) {
      throw new ConnectorError('INVALID_CREDENTIALS', {
        technicalDetail: 'Missing api_key or api_secret in decryptedSecrets',
      })
    }

    const client = new GoDaddyClient({
      apiKey,
      apiSecret,
      environment: context.environment,
    })

    const rawDomains = await client.listAllDomains()
    const resources = mapGoDaddyDomains(rawDomains)

    return { resources }
  }

  async listDomains(context: SyncContext) {
    const result = await this.sync(context)
    return result.resources.filter((r) => r.resourceType === 'domain') as import('../types').NormalizedDomain[]
  }
}
