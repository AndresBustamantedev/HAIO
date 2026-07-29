import { z } from "zod"

export const DOMAIN_STATUSES = ["pending", "active", "expired", "transferred", "cancelled", "unknown"] as const

export const domainSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  domain_name: z.string().trim().min(1, "El dominio es obligatorio.").max(255),
  status: z.enum(DOMAIN_STATUSES),
  registrar_name: z.string().trim().max(150).optional().or(z.literal("")),
  registered_on: z.string().trim().optional().or(z.literal("")),
  expires_on: z.string().trim().optional().or(z.literal("")),
  renewal_price: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Introduce un número válido."),
  auto_renew: z.boolean(),
  managed_by_us: z.boolean(),
  privacy_enabled: z.boolean(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type DomainInput = z.infer<typeof domainSchema>
