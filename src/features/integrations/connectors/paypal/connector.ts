import type {
  ProviderConnector,
  ConnectorMeta,
  ConnectorCapability,
  SyncContext,
  ConnectionTestResult,
  NormalizedResource,
} from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { PayPalClient } from './client'

const PAYPAL_CAPABILITIES = new Set<ConnectorCapability>([
  'billing.read',
  'billing.write',
  'invoices.read',
  'customers.read',
])

export const PAYPAL_META: ConnectorMeta = {
  connectorType: 'paypal',
  displayName: 'PayPal',
  description: 'Acepta pagos con PayPal en los links de pago de HAIO. Sincroniza transacciones e invoices.',
  category: 'Pagos',
  status: 'available',
  documentationUrl: 'https://developer.paypal.com/api/rest/',
  setupInstructions: [
    'En developer.paypal.com → My Apps & Credentials → crea o selecciona una app.',
    'Copia el Client ID y Client Secret de la sección Live (o Sandbox para pruebas).',
    'La app necesita permisos: Payouts, Invoicing, Transaction Search.',
  ],
  requiredSecrets: [
    {
      type: 'client_id',
      label: 'Client ID',
      description: 'Client ID de tu app de PayPal (empieza por "A"). No es secreto — va en el frontend para el SDK.',
      isPassword: false,
    },
    {
      type: 'client_secret',
      label: 'Client Secret',
      description: 'Client Secret de tu app de PayPal. Nunca lo compartas.',
      isPassword: true,
    },
  ],
  capabilities: PAYPAL_CAPABILITIES,
  supportedEnvironments: ['production', 'sandbox'],
}

export class PayPalConnector implements ProviderConnector {
  readonly connectorType = 'paypal'
  readonly capabilities = PAYPAL_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>, environment: 'production' | 'sandbox'): PayPalClient {
    const clientId     = secrets.get('client_id')
    const clientSecret = secrets.get('client_secret')
    if (!clientId || !clientSecret) {
      throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Faltan client_id o client_secret.' })
    }
    return new PayPalClient(clientId, clientSecret, environment)
  }

  async testConnection(
    secrets: ReadonlyMap<string, string>,
    environment: 'production' | 'sandbox',
  ): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets, environment)
      const profile = await client.getProfile()
      return { success: true, accountEmail: profile.email ?? undefined }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  // PayPal sync (v1 — solo verifica conexión; sync completo en fase futura)
  async sync(_context: SyncContext): Promise<{ resources: ReadonlyArray<NormalizedResource> }> {
    return { resources: [] }
  }
}
