import { ConnectorError } from '../errors'
import {
  stripeAccountSchema,
  stripeCustomerListSchema,
  stripeSubscriptionListSchema,
  stripeInvoiceListSchema,
  type StripeAccountRaw,
  type StripeCustomerRaw,
  type StripeSubscriptionRaw,
  type StripeInvoiceRaw,
} from './schemas'

const BASE_URL   = 'https://api.stripe.com'
const TIMEOUT_MS = 30_000
const PAGE_LIMIT = 100

export class StripeClient {
  private readonly headers: Record<string, string>

  constructor(secretKey: string) {
    this.headers = {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    }
  }

  async getAccount(): Promise<StripeAccountRaw> {
    const data = await this.get('/v1/account')
    const parsed = stripeAccountSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Account schema mismatch' })
    return parsed.data
  }

  async listAllCustomers(): Promise<StripeCustomerRaw[]> {
    return this.paginate(
      '/v1/customers',
      stripeCustomerListSchema,
    ) as Promise<StripeCustomerRaw[]>
  }

  async listAllSubscriptions(): Promise<StripeSubscriptionRaw[]> {
    return this.paginate(
      '/v1/subscriptions',
      stripeSubscriptionListSchema,
      { status: 'all' },
    ) as Promise<StripeSubscriptionRaw[]>
  }

  async listAllInvoices(): Promise<StripeInvoiceRaw[]> {
    return this.paginate(
      '/v1/invoices',
      stripeInvoiceListSchema,
    ) as Promise<StripeInvoiceRaw[]>
  }

  // ── Mutaciones (para create-stripe-invoice y portal) ───────────────────────

  async findOrCreateCustomer(email: string, name: string): Promise<string> {
    // Buscar por email (lista hasta 1 resultado)
    const searchData = await this.get(`/v1/customers?email=${encodeURIComponent(email)}&limit=1`)
    const searchParsed = stripeCustomerListSchema.safeParse(searchData)
    if (searchParsed.success && searchParsed.data.data.length > 0) {
      return searchParsed.data.data[0]!.id
    }

    // Crear nuevo customer
    const body = new URLSearchParams({ email, name })
    const newCustomer = await this.post('/v1/customers', body)
    const c = newCustomer as { id?: string }
    if (typeof c.id !== 'string') throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Customer create: missing id' })
    return c.id
  }

  async createInvoiceItem(params: {
    customer: string
    amount: number
    currency: string
    description: string
  }): Promise<void> {
    const body = new URLSearchParams({
      customer:    params.customer,
      amount:      String(Math.round(params.amount)),
      currency:    params.currency,
      description: params.description,
    })
    await this.post('/v1/invoiceitems', body)
  }

  async createInvoice(params: {
    customer: string
    currency: string
    daysUntilDue?: number
    description?: string
    metadata?: Record<string, string>
  }): Promise<{ id: string; hosted_invoice_url: string | null }> {
    const body = new URLSearchParams({
      customer:           params.customer,
      currency:           params.currency,
      collection_method:  'send_invoice',
      days_until_due:     String(params.daysUntilDue ?? 30),
    })
    if (params.description) body.set('description', params.description)
    if (params.metadata) {
      for (const [k, v] of Object.entries(params.metadata)) {
        body.set(`metadata[${k}]`, v)
      }
    }
    const data = await this.post('/v1/invoices', body)
    const inv = data as { id?: string; hosted_invoice_url?: string | null }
    if (typeof inv.id !== 'string') throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Invoice create: missing id' })
    return { id: inv.id, hosted_invoice_url: inv.hosted_invoice_url ?? null }
  }

  async finalizeInvoice(invoiceId: string): Promise<{ hosted_invoice_url: string | null }> {
    const data = await this.post(`/v1/invoices/${invoiceId}/finalize`, new URLSearchParams())
    const inv = data as { hosted_invoice_url?: string | null }
    return { hosted_invoice_url: inv.hosted_invoice_url ?? null }
  }

  async sendInvoice(invoiceId: string): Promise<void> {
    await this.post(`/v1/invoices/${invoiceId}/send`, new URLSearchParams())
  }

  async createPortalSession(params: {
    customer: string
    returnUrl: string
  }): Promise<{ url: string }> {
    const body = new URLSearchParams({
      customer:   params.customer,
      return_url: params.returnUrl,
    })
    const data = await this.post('/v1/billing_portal/sessions', body)
    const session = data as { url?: string }
    if (typeof session.url !== 'string') throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'Portal session: missing url' })
    return { url: session.url }
  }

  // ── Paginación genérica con cursor starting_after ──────────────────────────

  private async paginate<T extends { data: unknown[]; has_more: boolean }>(
    path: string,
    schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
    extraParams?: Record<string, string>,
  ): Promise<unknown[]> {
    const items: unknown[] = []
    let startingAfter: string | undefined

    for (let i = 0; i < 50; i++) {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT), ...extraParams })
      if (startingAfter) params.set('starting_after', startingAfter)

      const data = await this.get(`${path}?${params}`)
      const parsed = schema.safeParse(data)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: `${path} schema mismatch` })

      items.push(...parsed.data.data)
      if (!parsed.data.has_more) break

      const last = parsed.data.data[parsed.data.data.length - 1] as { id?: string }
      if (!last?.id) break
      startingAfter = last.id
    }

    return items
  }

  private async get(path: string): Promise<unknown> {
    return this.request('GET', path)
  }

  private async post(path: string, body: URLSearchParams): Promise<unknown> {
    return this.request('POST', path, body)
  }

  private async request(method: string, path: string, body?: URLSearchParams): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: this.headers,
        body: method === 'POST' ? body : undefined,
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after') ?? 60)
        throw new ConnectorError('RATE_LIMITED', { retryable: true, retryAfterSeconds: retryAfter })
      }
      if (res.status >= 500) throw new ConnectorError('PROVIDER_UNAVAILABLE', { retryable: true })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } }
        throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
          technicalDetail: errBody.error?.message?.slice(0, 200) ?? `HTTP ${res.status}`,
        })
      }

      return await res.json()
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }
}
