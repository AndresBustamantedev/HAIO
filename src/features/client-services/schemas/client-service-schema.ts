import { z } from "zod"
import { BILLING_INTERVALS } from "@/features/services/schemas/service-schema"

export const CLIENT_SERVICE_CURRENCIES = ["EUR", "USD", "GBP", "MXN", "COP"] as const

export const clientServiceSchema = z.object({
  service_id: z.string().uuid("Selecciona un servicio del catálogo."),
  name_override: z.string().trim().max(200).optional().or(z.literal("")),
  unit_price: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Precio no válido."),
  quantity: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Cantidad no válida."),
  currency_code: z.string().length(3),
  billing_interval: z.enum(BILLING_INTERVALS).optional().or(z.literal("")),
  starts_on: z.string().optional().or(z.literal("")),
  ends_on: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type ClientServiceInput = z.infer<typeof clientServiceSchema>
