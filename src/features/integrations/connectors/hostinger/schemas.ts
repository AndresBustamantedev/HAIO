import { z } from 'zod'

// ── VPS ───────────────────────────────────────────────────────────────────────

export const hostingerVMSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  state: z.enum(['running', 'stopped', 'starting', 'stopping', 'error']),
  cpus: z.number().optional().default(0),
  memory: z.number().optional().default(0),
  disk: z.number().optional().default(0),
  created_at: z.string().optional().default(''),
  ipv4: z.string().nullable().optional(),
  template: z.object({ name: z.string(), description: z.string() }).optional(),
  plan: z.object({ name: z.string() }).optional(),
})

export const hostingerVMListSchema = z.array(hostingerVMSchema)
export type HostingerVMRaw = z.infer<typeof hostingerVMSchema>

// ── Dominios (portfolio) ──────────────────────────────────────────────────────

export const hostingerDomainSchema = z.object({
  domain: z.string(),
  status: z.string().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  autorenew: z.boolean().optional(),
  locked: z.boolean().optional(),
}).passthrough()

export const hostingerDomainListSchema = z.array(hostingerDomainSchema)
export type HostingerDomainRaw = z.infer<typeof hostingerDomainSchema>

// ── Suscripciones de facturación ──────────────────────────────────────────────

export const hostingerSubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional().default('unknown'),
  billing_period: z.number().optional(),
  billing_period_unit: z.string().optional(),
  currency_code: z.string().optional(),
  total_price: z.number().optional(),        // en centavos
  renewal_price: z.number().optional(),
  is_auto_renewed: z.boolean().optional().default(false),
  created_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  next_billing_at: z.string().nullable().optional(),
}).passthrough()

export const hostingerSubscriptionListSchema = z.array(hostingerSubscriptionSchema)
export type HostingerSubscriptionRaw = z.infer<typeof hostingerSubscriptionSchema>

// ── Websites (hosting compartido) ─────────────────────────────────────────────

export const hostingerWebsiteSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  domain: z.string(),
  username: z.string().optional(),
  is_enabled: z.boolean().optional().default(true),
  status: z.string().optional().default('created'),
  created_at: z.string().nullable().optional(),
}).passthrough()

export const hostingerWebsiteListSchema = z.array(hostingerWebsiteSchema)
export type HostingerWebsiteRaw = z.infer<typeof hostingerWebsiteSchema>
