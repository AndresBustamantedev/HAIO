import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { CloudflareClient } from './client'
import { mapCloudflareZones } from './mapper'

const CLOUDFLARE_CAPABILITIES = new Set<ConnectorCapability>([
  'dns.read',
])

export const CLOUDFLARE_META: ConnectorMeta = {
  connectorType: 'cloudflare',
  displayName: 'Cloudflare',
  description: 'Sincroniza zonas DNS gestionadas en Cloudflare.',
  category: 'Dominios y DNS',
  status: 'available',
  documentationUrl: 'https://developers.cloudflare.com/api',
  requiredSecrets: [
    {
      type: 'api_token',
      label: 'API Token',
      description: 'Token de API con permiso Zone:Read. Créalo en dash.cloudflare.com → My Profile → API Tokens.',
      isPassword: true,
    },
  ],
  capabilities: CLOUDFLARE_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class CloudflareConnector implements ProviderConnector {
  readonly connectorType = 'cloudflare'
  readonly capabilities = CLOUDFLARE_CAPABILITIES

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    const apiToken = secrets.get('api_token')
    if (!apiToken) {
      return {
        success: false,
        error: new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta api_token.' }),
      }
    }

    try {
      const client = new CloudflareClient(apiToken)
      const token = await client.verifyToken()
      if (token.status !== 'active') {
        return {
          success: false,
          error: new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: `Token status: ${token.status}` }),
        }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const apiToken = context.decryptedSecrets.get('api_token')
    if (!apiToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Missing api_token' })

    const client = new CloudflareClient(apiToken)
    const rawZones = await client.listAllZones()
    const resources = mapCloudflareZones(rawZones)

    return { resources }
  }
}
