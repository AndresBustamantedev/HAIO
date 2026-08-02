import { z } from "zod"

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "refunded",
] as const

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Descripción obligatoria."),
  quantity: z.string().trim().min(1).refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Cantidad inválida."),
  unit_price: z.string().trim().refine((v) => !Number.isNaN(Number(v)), "Precio inválido."),
  tax_rate: z.string().trim().optional().or(z.literal("")),
  discount_percent: z.string().trim().optional().or(z.literal("")),
})

export const INVOICE_CURRENCIES = [
  { code: "EUR", label: "EUR — Euro" },
  { code: "USD", label: "USD — Dólar americano" },
  { code: "GBP", label: "GBP — Libra esterlina" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "COP", label: "COP — Peso colombiano" },
  { code: "ARS", label: "ARS — Peso argentino" },
  { code: "CLP", label: "CLP — Peso chileno" },
  { code: "BRL", label: "BRL — Real brasileño" },
] as const

export const invoiceSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  currency_code: z.string().length(3),
  status: z.enum(INVOICE_STATUSES),
  issue_date: z.string().trim().min(1, "La fecha de emisión es obligatoria."),
  due_date: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Añade al menos una línea."),
})

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
