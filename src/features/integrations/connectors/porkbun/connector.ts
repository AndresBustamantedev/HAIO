import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult, NormalizedDomain } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { PorkbunClient } from './client'
import { mapPorkbunDomains } from './mapper'

const PORKBUN_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'domains.expiration',
  'domains.autorenew',
])

export const PORKBUN_META: ConnectorMeta = {
  connectorType: 'porkbun',
  displayName: 'Porkbun',
  description: 'Sincroniza dominios registrados en Porkbun.',
  category: 'Dominios y DNS',
  status: 'available',
  documentationUrl: 'https://porkbun.com/api/json/v3/documentation',
  requiredSecrets: [
    {
      type: 'api_key',
      label: 'API Key',
      description: 'Clave API obtenida en porkbun.com → Account → API Access.',
      isPassword: false,
    },
    {
      type: 'secret_api_key',
      label: 'Secret API Key',
      description: 'Secreto API asociado a la clave API de Porkbun.',
      isPassword: true,
    },
  ],
  capabilities: PORKBUN_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class PorkbunConnector implements ProviderConnector {
  readonly connectorType = 'porkbun'
  readonly capabilities = PORKBUN_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): PorkbunClient {
    const apiKey       = secrets.get('api_key')
    const secretApiKey = secrets.get('secret_api_key')

    if (!apiKey || !secretApiKey) {
      throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Faltan api_key o secret_api_key.' })
    }

    return new PorkbunClient(apiKey, secretApiKey)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      await client.ping()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets)
    const rawDomains = await client.listAllDomains()
    const resources = mapPorkbunDomains(rawDomains)

    return { resources }
  }

  async listDomains(context: SyncContext): Promise<ReadonlyArray<NormalizedDomain>> {
    const result = await this.sync(context)
    return result.resources as NormalizedDomain[]
  }
}
