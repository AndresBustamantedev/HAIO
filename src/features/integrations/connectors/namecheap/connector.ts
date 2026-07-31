import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult, NormalizedDomain } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { NamecheapClient } from './client'
import { mapNamecheapDomains } from './mapper'

const NAMECHEAP_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'domains.expiration',
  'domains.autorenew',
])

export const NAMECHEAP_META: ConnectorMeta = {
  connectorType: 'namecheap',
  displayName: 'Namecheap',
  description: 'Sincroniza dominios registrados en Namecheap.',
  category: 'Dominios y DNS',
  status: 'setup_required',
  documentationUrl: 'https://www.namecheap.com/support/api/intro/',
  setupInstructions: [
    'Activa la API en tu perfil de Namecheap: Profile → Tools → Namecheap API Access.',
    'Añade la IP pública del servidor de HAIO a la lista blanca de IPs en la misma sección.',
    'La API solo funciona si la cuenta tiene al menos 20 dominios o ha gastado más de 50 USD.',
  ],
  requiredSecrets: [
    {
      type: 'api_key',
      label: 'API Key',
      description: 'Clave API obtenida en Profile → Tools → Namecheap API Access.',
      isPassword: true,
    },
    {
      type: 'api_user',
      label: 'Username',
      description: 'Tu nombre de usuario de Namecheap.',
      isPassword: false,
    },
    {
      type: 'client_ip',
      label: 'IP del servidor',
      description: 'IP pública del servidor que realiza las llamadas API. Debe estar en la lista blanca de Namecheap.',
      isPassword: false,
    },
  ],
  capabilities: NAMECHEAP_CAPABILITIES,
  supportedEnvironments: ['production', 'sandbox'],
}

export class NamecheapConnector implements ProviderConnector {
  readonly connectorType = 'namecheap'
  readonly capabilities = NAMECHEAP_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>, sandbox: boolean): NamecheapClient {
    const apiKey   = secrets.get('api_key')
    const apiUser  = secrets.get('api_user')
    const clientIp = secrets.get('client_ip')

    if (!apiKey || !apiUser || !clientIp) {
      throw new ConnectorError('INVALID_CREDENTIALS', {
        technicalDetail: 'Faltan api_key, api_user o client_ip.',
      })
    }

    return new NamecheapClient(apiUser, apiKey, clientIp, sandbox)
  }

  async testConnection(secrets: ReadonlyMap<string, string>, environment: 'production' | 'sandbox'): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets, environment === 'sandbox')
      await client.ping()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets, context.environment === 'sandbox')
    const rawDomains = await client.listAllDomains()
    const resources = mapNamecheapDomains(rawDomains)

    return { resources }
  }

  async listDomains(context: SyncContext): Promise<ReadonlyArray<NormalizedDomain>> {
    const result = await this.sync(context)
    return result.resources as NormalizedDomain[]
  }
}
