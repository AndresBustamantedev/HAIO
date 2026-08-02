import { ConnectorError } from '../errors'
import { paypalTokenResponseSchema, paypalOrderSchema, paypalCaptureSchema } from './schemas'
import type { PayPalOrderRaw, PayPalCaptureRaw } from './schemas'

const TIMEOUT_MS = 30_000

export class PayPalClient {
  private readonly baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    environment: 'production' | 'sandbox' = 'production',
  ) {
    this.baseUrl = environment === 'sandbox'
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com'
  }

  async getProfile(): Promise<{ email: string | null }> {
    await this.ensureToken()
    const data = await this.get('/v1/identity/oauth2/userinfo?schema=paypalv1.1')
    const profile = data as { emails?: Array<{ value: string }> }
    return { email: profile.emails?.[0]?.value ?? null }
  }

  async createOrder(params: {
    amount: number
    currency: string
    invoiceId: string
    description?: string
    returnUrl: string
    cancelUrl: string
  }): Promise<PayPalOrderRaw> {
    await this.ensureToken()

    const body = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: params.invoiceId,
        description:  params.description ?? `Factura ${params.invoiceId}`,
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: (params.amount / 100).toFixed(2),
        },
        invoice_id: params.invoiceId,
      }],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'HAIO',
        user_action: 'PAY_NOW',
        landing_page: 'NO_PREFERENCE',
      },
    }

    const data = await this.post('/v2/checkout/orders', body)
    const parsed = paypalOrderSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'PayPal order schema mismatch' })
    return parsed.data
  }

  async captureOrder(orderId: string): Promise<PayPalCaptureRaw> {
    await this.ensureToken()
    const data = await this.post(`/v2/checkout/orders/${orderId}/capture`, {})
    const parsed = paypalCaptureSchema.safeParse(data)
    if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE', { technicalDetail: 'PayPal capture schema mismatch' })
    return parsed.data
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  private async ensureToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) return

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (!res.ok) throw new ConnectorError('PROVIDER_UNAVAILABLE', { retryable: true })

      const json = await res.json()
      const parsed = paypalTokenResponseSchema.safeParse(json)
      if (!parsed.success) throw new ConnectorError('INVALID_RESPONSE')

      this.accessToken = parsed.data.access_token
      this.tokenExpiry = Date.now() + parsed.data.expires_in * 1000
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }

  private async get(path: string): Promise<unknown> {
    return this.request('GET', path)
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    return this.request('POST', path, body)
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken!}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': crypto.randomUUID(),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (res.status === 401 || res.status === 403) throw new ConnectorError('INVALID_CREDENTIALS')
      if (res.status === 429) throw new ConnectorError('RATE_LIMITED', { retryable: true })
      if (res.status >= 500) throw new ConnectorError('PROVIDER_UNAVAILABLE', { retryable: true })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { message?: string }
        throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
          technicalDetail: errBody.message?.slice(0, 200) ?? `HTTP ${res.status}`,
        })
      }

      const text = await res.text()
      return text ? JSON.parse(text) : {}
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }
}
