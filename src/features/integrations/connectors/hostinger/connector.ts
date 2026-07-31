import type {
  ProviderConnector,
  ConnectorMeta,
  ConnectorCapability,
  SyncContext,
  ConnectionTestResult,
  NormalizedResource,
} from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { HostingerClient } from './client'
import {
  mapHostingerVMs,
  mapHostingerDomains,
  mapHostingerSubscriptions,
  mapHostingerWebsites,
} from './mapper'

const HOSTINGER_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'domains.expiration',
  'hosting.read',
])

export const HOSTINGER_META: ConnectorMeta = {
  connectorType: 'hostinger',
  displayName: 'Hostinger',
  description: 'Sincroniza dominios, suscripciones, websites y VPS de Hostinger.',
  category: 'Hosting y VPS',
  status: 'available',
  documentationUrl: 'https://developers.hostinger.com',
  requiredSecrets: [
    {
      type: 'api_token',
      label: 'API Token',
      description: 'Token de acceso generado en hpanel.hostinger.com → API.',
      isPassword: true,
    },
  ],
  capabilities: HOSTINGER_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class HostingerConnector implements ProviderConnector {
  readonly connectorType = 'hostinger'
  readonly capabilities = HOSTINGER_CAPABILITIES

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    const apiToken = secrets.get('api_token')
    if (!apiToken) {
      return {
        success: false,
        error: new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta api_token.' }),
      }
    }

    try {
      const client = new HostingerClient(apiToken)
      // Endpoint confirmado funcional para todas las cuentas Hostinger
      await client.listSubscriptions()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const apiToken = context.decryptedSecrets.get('api_token')
    if (!apiToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Missing api_token' })

    const client = new HostingerClient(apiToken)
    const resources: NormalizedResource[] = []

    // 1. Suscripciones de facturación — disponibles para todas las cuentas
    const rawSubs = await client.listSubscriptions()
    resources.push(...mapHostingerSubscriptions(rawSubs))

    // 2. Portfolio de dominios registrados en Hostinger
    try {
      const rawDomains = await client.listDomains()
      resources.push(...mapHostingerDomains(rawDomains))
    } catch {
      // El portfolio puede estar vacío o no disponible sin plan de dominios
    }

    // 3. Websites de hosting compartido (WordPress Starter, etc.)
    try {
      const rawWebsites = await client.listWebsites()
      resources.push(...mapHostingerWebsites(rawWebsites))
    } catch {
      // Puede fallar si no hay plan de hosting activo
    }

    // 4. Servidores VPS — solo cuentas con plan VPS
    try {
      const rawVMs = await client.listVirtualMachines()
      resources.push(...mapHostingerVMs(rawVMs))
    } catch {
      // Cuentas sin VPS: no es error fatal
    }

    return { resources }
  }
}
