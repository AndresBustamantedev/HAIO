import type { ProviderConnector, ConnectorMeta, ConnectorCapability, SyncContext, ConnectionTestResult } from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { ZohoMailClient } from './client'
import { mapZohoMailAccounts } from './mapper'

const ZOHO_CAPABILITIES = new Set<ConnectorCapability>([
  'mail.read',
  'mailboxes.read',
])

export const ZOHO_MAIL_META: ConnectorMeta = {
  connectorType: 'zoho-mail',
  displayName: 'Zoho Mail',
  description: 'Sincroniza cuentas de correo de Zoho Mail.',
  category: 'Email',
  status: 'setup_required',
  documentationUrl: 'https://www.zoho.com/mail/help/api/',
  setupInstructions: [
    'Obtén un Access Token OAuth desde la Zoho Developer Console con el scope ZohoMail.accounts.READ.',
    'El token expira en 1 hora — deberás rotarlo antes de cada sincronización o implementar refresh.',
    'Indica tu región: com (EE. UU.), eu (Europa), in (India), com.au (Australia), jp (Japón).',
  ],
  requiredSecrets: [
    {
      type: 'access_token',
      label: 'Access Token OAuth',
      description: 'Token OAuth obtenido desde la consola de desarrolladores de Zoho.',
      isPassword: true,
    },
    {
      type: 'region',
      label: 'Región (opcional)',
      description: 'Región del datacenter de Zoho: com (por defecto), eu, in, com.au, jp.',
      isPassword: false,
    },
  ],
  capabilities: ZOHO_CAPABILITIES,
  supportedEnvironments: ['production'],
}

export class ZohoMailConnector implements ProviderConnector {
  readonly connectorType = 'zoho-mail'
  readonly capabilities = ZOHO_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): ZohoMailClient {
    const accessToken = secrets.get('access_token')
    if (!accessToken) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta access_token.' })
    const region = secrets.get('region') || 'com'
    return new ZohoMailClient(accessToken, region)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      await client.listAccounts()
      return { success: true }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext) {
    const client = this.buildClient(context.decryptedSecrets)
    const rawAccounts = await client.listAccounts()
    const resources = mapZohoMailAccounts(rawAccounts)

    return { resources }
  }
}
