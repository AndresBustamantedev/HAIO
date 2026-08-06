import { z } from "zod"

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "paused", "cancelled", "expired"] as const

export const BILLING_INTERVALS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "biennial",
  "custom",
] as const

export const subscriptionSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  service_id: z.string().uuid("Selecciona un servicio."),
  project_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(SUBSCRIPTION_STATUSES),
  billing_interval: z.enum(BILLING_INTERVALS),
  amount: z.string().trim().min(1, "El importe es obligatorio.").refine((v) => !Number.isNaN(Number(v)), "Importe inválido."),
  current_period_start: z.string().trim().optional().or(z.literal("")),
  current_period_end: z.string().trim().optional().or(z.literal("")),
  cancel_at: z.string().trim().optional().or(z.literal("")),
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>
