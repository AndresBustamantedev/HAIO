import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult, NormalizedResource } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { OvhClient } from './client'
import { mapOvhDomain, mapOvhHosting } from './mapper'

const OVH_CAPABILITIES = new Set<ConnectorCapability>([
  'domains.read',
  'domains.expiration',
  'domains.autorenew',
  'hosting.read',
])

export const OVH_META: ConnectorMeta = {
  connectorType: 'ovh',
  displayName: 'OVH',
  description: 'Sincroniza dominios y hosting gestionados en OVHcloud.',
  category: 'Dominios y DNS',
  status: 'setup_required',
  documentationUrl: 'https://api.ovh.com/console',
  setupInstructions: [
    'Ve a eu.api.ovh.com/createApp y crea una aplicación para obtener la Application Key y el Application Secret.',
    'Usa eu.api.ovh.com/createToken para generar el Consumer Key concediendo permisos GET sobre /domain/* y /hosting/web/*.',
    'El Consumer Key tiene validez limitada — renuévalo antes de que expire.',
  ],
  requiredSecrets: [
    {
      type: 'application_key',
      label: 'Application Key',
      description: 'Clave de aplicación obtenida en eu.api.ovh.com/createApp.',
      isPassword: false,
    },
    {
      type: 'application_secret',
      label: 'Application Secret',
      description: 'Secreto de la aplicación OVH.',
      isPassword: true,
    },
    {
      type: 'consumer_key',
      label: 'Consumer Key',
      description: 'Token de usuario (Consumer Key) generado tras la validación OAuth de OVH.',
      isPassword: true,
    },
  ],
  capabilities: OVH_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class OvhConnector implements ProviderConnector {
  readonly connectorType = 'ovh'
  readonly capabilities = OVH_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): OvhClient {
    const applicationKey    = secrets.get('application_key')
    const applicationSecret = secrets.get('application_secret')
    const consumerKey       = secrets.get('consumer_key')

    if (!applicationKey || !applicationSecret || !consumerKey) {
      throw new ConnectorError('INVALID_CREDENTIALS', {
        technicalDetail: 'Faltan application_key, application_secret o consumer_key.',
      })
    }

    return new OvhClient({ applicationKey, applicationSecret, consumerKey })
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

    // Dominios
    const domainNames = await client.listDomains()
    for (const name of domainNames) {
      try {
        const info = await client.getDomainServiceInfo(name)
        resources.push(mapOvhDomain(name, info))
      } catch {
        // Si un dominio individual falla, continuamos con el resto
      }
    }

    // Hosting
    const hostingNames = await client.listHosting()
    for (const name of hostingNames) {
      try {
        const info = await client.getHostingInfo(name)
        resources.push(mapOvhHosting(name, info))
      } catch {
        // Si un hosting individual falla, continuamos con el resto
      }
    }

    return { resources }
  }
}
