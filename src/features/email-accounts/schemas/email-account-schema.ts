import { z } from "zod"

export const EMAIL_ACCOUNT_STATUSES = ["active", "inactive", "suspended"] as const

export const emailAccountSchema = z.object({
  email_service_id: z.string().uuid("Selecciona un servicio de correo."),
  address: z
    .string()
    .trim()
    .min(1, "La dirección es obligatoria.")
    .email("Introduce una dirección de correo válida."),
  display_name: z.string().trim().max(150).optional().or(z.literal("")),
  status: z.enum(EMAIL_ACCOUNT_STATUSES),
  quota_mb: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Number(v)), "Introduce un número válido."),
  forwards_to: z.string().trim().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type EmailAccountInput = z.infer<typeof emailAccountSchema>
