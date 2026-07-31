import { createHash } from 'crypto'
import type {
  NormalizedPaymentCustomer,
  NormalizedPaymentSubscription,
  NormalizedPaymentInvoice,
} from '../types'
import type { StripeCustomerRaw, StripeSubscriptionRaw, StripeInvoiceRaw } from './schemas'

function hash(obj: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex')
}

function tsToIso(ts: number | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts * 1000).toISOString()
}

function customerId(raw: { customer: string | { id: string } }): string {
  return typeof raw.customer === 'string' ? raw.customer : raw.customer.id
}

// ── Customer ───────────────────────────────────────────────────────────────────

export function mapStripeCustomer(raw: StripeCustomerRaw): NormalizedPaymentCustomer {
  const status = raw.deleted ? 'deleted' : (raw.delinquent ? 'delinquent' : 'active')

  return {
    resourceType: 'payment_customer',
    externalId:   raw.id,
    externalName: raw.name ?? raw.email ?? raw.id,
    externalStatus: status,
    externalPayloadHash: hash({ email: raw.email ?? null, name: raw.name ?? null, balance: raw.balance ?? 0 }),
    rawMetadata: {
      customerId: raw.id,
      email:      raw.email ?? null,
      name:       raw.name ?? null,
      currency:   raw.currency ?? null,
      balance:    raw.balance ?? 0,
      delinquent: raw.delinquent ?? false,
      createdAt:  tsToIso(raw.created),
    },
  } satisfies NormalizedPaymentCustomer
}

// ── Subscription ──────────────────────────────────────────────────────────────

export function mapStripeSubscription(raw: StripeSubscriptionRaw): NormalizedPaymentSubscription {
  const firstItem = raw.items?.data[0]
  const price = firstItem?.price
  const productName =
    typeof price?.product === 'object' && price.product !== null
      ? (price.product as { name?: string }).name ?? null
      : null
  const priceNickname = price?.nickname ?? null
  const interval = price?.recurring ? `${price.recurring.interval_count} ${price.recurring.interval}` : null
  const unitAmount = price?.unit_amount ?? null
  const currency = price?.currency ?? raw.currency ?? null
  const quantity = firstItem?.quantity ?? null

  const periodEnd = tsToIso(raw.current_period_end)

  return {
    resourceType: 'payment_subscription',
    externalId:   raw.id,
    externalName: productName ?? priceNickname ?? raw.id,
    externalStatus: raw.status,
    externalPayloadHash: hash({ status: raw.status, periodEnd, cancelAtPeriodEnd: raw.cancel_at_period_end ?? false }),
    rawMetadata: {
      subscriptionId:    raw.id,
      customerId:        customerId(raw),
      status:            raw.status,
      productName:       productName ?? priceNickname,
      interval,
      unitAmount,
      currency,
      quantity,
      currentPeriodStart: tsToIso(raw.current_period_start),
      currentPeriodEnd:   periodEnd,
      cancelAtPeriodEnd:  raw.cancel_at_period_end ?? false,
      canceledAt:         tsToIso(raw.canceled_at),
      trialEnd:           tsToIso(raw.trial_end),
      expiresOn:          periodEnd,
    },
  } satisfies NormalizedPaymentSubscription
}

// ── Invoice ────────────────────────────────────────────────────────────────────

export function mapStripeInvoice(raw: StripeInvoiceRaw): NormalizedPaymentInvoice {
  const dueDate = tsToIso(raw.due_date)

  return {
    resourceType: 'payment_invoice',
    externalId:   raw.id,
    externalName: raw.number ?? raw.id,
    externalStatus: raw.status ?? 'unknown',
    externalPayloadHash: hash({ status: raw.status ?? null, amountPaid: raw.amount_paid, amountDue: raw.amount_due }),
    rawMetadata: {
      invoiceId:        raw.id,
      number:           raw.number ?? null,
      customerId:       customerId(raw),
      subscriptionId:   raw.subscription ?? null,
      status:           raw.status ?? null,
      currency:         raw.currency,
      amountDue:        raw.amount_due,
      amountPaid:       raw.amount_paid,
      amountRemaining:  raw.amount_remaining,
      total:            raw.total,
      description:      raw.description ?? null,
      hostedInvoiceUrl: raw.hosted_invoice_url ?? null,
      invoicePdf:       raw.invoice_pdf ?? null,
      dueDate,
      periodStart:      tsToIso(raw.period_start),
      periodEnd:        tsToIso(raw.period_end),
      createdAt:        tsToIso(raw.created),
    },
  } satisfies NormalizedPaymentInvoice
}
