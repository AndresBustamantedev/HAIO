import { z } from "zod"

export const EMAIL_SERVICE_STATUSES = ["pending", "active", "suspended", "expired", "cancelled"] as const

export const emailServiceSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  provider_name: z.string().trim().min(1, "El proveedor es obligatorio.").max(150),
  plan_name: z.string().trim().max(150).optional().or(z.literal("")),
  status: z.enum(EMAIL_SERVICE_STATUSES),
  starts_on: z.string().trim().optional().or(z.literal("")),
  expires_on: z.string().trim().optional().or(z.literal("")),
  renewal_price: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Introduce un número válido."),
  auto_renew: z.boolean(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type EmailServiceInput = z.infer<typeof emailServiceSchema>
