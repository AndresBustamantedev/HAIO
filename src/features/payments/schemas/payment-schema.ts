import { z } from "zod"

export const PAYMENT_METHODS = ["bank_transfer", "card", "cash", "paypal", "stripe", "direct_debit", "other"] as const

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const

export const paymentSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  invoice_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().trim().min(1, "El importe es obligatorio.").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Importe inválido."),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  paid_at: z.string().trim().optional().or(z.literal("")),
  reference: z.string().trim().max(200).optional().or(z.literal("")),
  failure_reason: z.string().trim().max(500).optional().or(z.literal("")),
})

export type PaymentInput = z.infer<typeof paymentSchema>
