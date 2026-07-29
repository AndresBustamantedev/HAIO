import { z } from "zod"

export const QUOTE_STATUSES = ["draft", "sent", "viewed", "accepted", "rejected", "expired", "cancelled"] as const

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Descripción obligatoria."),
  quantity: z.string().trim().min(1).refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Cantidad inválida."),
  unit_price: z.string().trim().refine((v) => !Number.isNaN(Number(v)), "Precio inválido."),
  tax_rate: z.string().trim().optional().or(z.literal("")),
  discount_percent: z.string().trim().optional().or(z.literal("")),
})

export const quoteSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  status: z.enum(QUOTE_STATUSES),
  issue_date: z.string().trim().min(1, "La fecha de emisión es obligatoria."),
  valid_until: z.string().trim().optional().or(z.literal("")),
  terms: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(quoteItemSchema).min(1, "Añade al menos una línea."),
})

export type QuoteItemInput = z.infer<typeof quoteItemSchema>
export type QuoteInput = z.infer<typeof quoteSchema>
