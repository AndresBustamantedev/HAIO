import type {
  ProviderConnector,
  ConnectorMeta,
  ConnectorCapability,
  SyncContext,
  ConnectionTestResult,
  NormalizedResource,
} from '../types'
import { ConnectorError, toConnectorError } from '../errors'
import { StripeClient } from './client'
import { mapStripeCustomer, mapStripeSubscription, mapStripeInvoice } from './mapper'

const STRIPE_CAPABILITIES = new Set<ConnectorCapability>([
  'billing.read',
  'billing.write',
  'subscriptions.read',
  'invoices.read',
  'customers.read',
])

export const STRIPE_META: ConnectorMeta = {
  connectorType: 'stripe',
  displayName: 'Stripe',
  description: 'Sincroniza clientes, suscripciones y facturas de Stripe. Permite crear facturas y links al portal del cliente.',
  category: 'Pagos',
  status: 'available',
  documentationUrl: 'https://stripe.com/docs/api',
  setupInstructions: [
    'En Stripe Dashboard → Developers → API Keys, copia la Secret Key (empieza por sk_live_ o sk_test_).',
    'Usa sk_test_ para entornos de prueba y sk_live_ para producción.',
    'La clave necesita permisos de lectura sobre Customers, Subscriptions e Invoices.',
  ],
  requiredSecrets: [
    {
      type: 'secret_key',
      label: 'Secret Key',
      description: 'Clave secreta de Stripe (sk_live_... o sk_test_...). Nunca uses la Publishable Key.',
      isPassword: true,
    },
  ],
  capabilities: STRIPE_CAPABILITIES,
  supportedEnvironments: ['production', 'sandbox'],
}

export class StripeConnector implements ProviderConnector {
  readonly connectorType = 'stripe'
  readonly capabilities = STRIPE_CAPABILITIES

  private buildClient(secrets: ReadonlyMap<string, string>): StripeClient {
    const secretKey = secrets.get('secret_key')
    if (!secretKey) throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: 'Falta secret_key.' })
    return new StripeClient(secretKey)
  }

  async testConnection(secrets: ReadonlyMap<string, string>): Promise<ConnectionTestResult> {
    try {
      const client = this.buildClient(secrets)
      const account = await client.getAccount()
      const accountName =
        account.settings?.dashboard?.display_name ??
        account.business_profile?.name ??
        account.email ??
        account.id
      return { success: true, accountName: accountName ?? undefined, accountEmail: account.email ?? undefined }
    } catch (err) {
      return { success: false, error: toConnectorError(err) }
    }
  }

  async sync(context: SyncContext): Promise<{ resources: ReadonlyArray<NormalizedResource> }> {
    const client = this.buildClient(context.decryptedSecrets)
    const resources: NormalizedResource[] = []

    const [rawCustomers, rawSubscriptions, rawInvoices] = await Promise.all([
      client.listAllCustomers(),
      client.listAllSubscriptions(),
      client.listAllInvoices(),
    ])

    resources.push(...rawCustomers.map(mapStripeCustomer))
    resources.push(...rawSubscriptions.map(mapStripeSubscription))
    resources.push(...rawInvoices.map(mapStripeInvoice))

    return { resources }
  }
}
