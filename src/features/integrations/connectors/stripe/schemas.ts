import { z } from 'zod'

// ── Account ────────────────────────────────────────────────────────────────────

export const stripeAccountSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  business_profile: z.object({
    name: z.string().nullable().optional(),
  }).optional(),
  settings: z.object({
    dashboard: z.object({
      display_name: z.string().nullable().optional(),
    }).optional(),
  }).optional(),
}).passthrough()

// ── Customer ───────────────────────────────────────────────────────────────────

export const stripeCustomerSchema = z.object({
  id: z.string(),
  object: z.literal('customer'),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  created: z.number(),
  currency: z.string().nullable().optional(),
  balance: z.number().optional(),
  delinquent: z.boolean().nullable().optional(),
  deleted: z.literal(true).optional(),
}).passthrough()

export const stripeListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    object: z.literal('list'),
    data: z.array(itemSchema),
    has_more: z.boolean(),
    url: z.string().optional(),
  })

export const stripeCustomerListSchema = stripeListResponseSchema(stripeCustomerSchema)

// ── Subscription ──────────────────────────────────────────────────────────────

export const stripeSubscriptionSchema = z.object({
  id: z.string(),
  object: z.literal('subscription'),
  customer: z.union([z.string(), z.object({ id: z.string() }).passthrough()]),
  status: z.string(),
  currency: z.string().nullable().optional(),
  current_period_start: z.number(),
  current_period_end: z.number(),
  cancel_at_period_end: z.boolean().optional(),
  canceled_at: z.number().nullable().optional(),
  trial_end: z.number().nullable().optional(),
  items: z.object({
    data: z.array(z.object({
      price: z.object({
        id: z.string(),
        nickname: z.string().nullable().optional(),
        unit_amount: z.number().nullable().optional(),
        currency: z.string().optional(),
        recurring: z.object({
          interval: z.string(),
          interval_count: z.number(),
        }).nullable().optional(),
        product: z.union([z.string(), z.object({ name: z.string().optional() }).passthrough()]).optional(),
      }).passthrough(),
      quantity: z.number().nullable().optional(),
    }).passthrough()),
  }).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
}).passthrough()

export const stripeSubscriptionListSchema = stripeListResponseSchema(stripeSubscriptionSchema)

// ── Invoice ────────────────────────────────────────────────────────────────────

export const stripeInvoiceSchema = z.object({
  id: z.string(),
  object: z.literal('invoice'),
  customer: z.union([z.string(), z.object({ id: z.string() }).passthrough()]),
  subscription: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  currency: z.string(),
  amount_due: z.number(),
  amount_paid: z.number(),
  amount_remaining: z.number(),
  total: z.number(),
  created: z.number(),
  due_date: z.number().nullable().optional(),
  period_start: z.number(),
  period_end: z.number(),
  number: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  hosted_invoice_url: z.string().nullable().optional(),
  invoice_pdf: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
}).passthrough()

export const stripeInvoiceListSchema = stripeListResponseSchema(stripeInvoiceSchema)

// ── Types ──────────────────────────────────────────────────────────────────────

export type StripeAccountRaw    = z.infer<typeof stripeAccountSchema>
export type StripeCustomerRaw   = z.infer<typeof stripeCustomerSchema>
export type StripeSubscriptionRaw = z.infer<typeof stripeSubscriptionSchema>
export type StripeInvoiceRaw    = z.infer<typeof stripeInvoiceSchema>
