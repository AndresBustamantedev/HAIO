import { z } from "zod"

export const SERVICE_CATEGORIES = [
  "development",
  "design",
  "hosting",
  "domain",
  "email",
  "maintenance",
  "seo",
  "analytics",
  "support",
  "consulting",
  "other",
] as const

export const SERVICE_BILLING_TYPES = ["one_time", "recurring", "usage_based", "free"] as const

export const BILLING_INTERVALS = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "biennial",
  "custom",
] as const

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  code: z.string().trim().min(1, "El código es obligatorio.").max(50),
  category: z.enum(SERVICE_CATEGORIES),
  billing_type: z.enum(SERVICE_BILLING_TYPES),
  default_interval: z.enum(BILLING_INTERVALS).optional().or(z.literal("")),
  default_price: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Introduce un número válido."),
  tax_rate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Introduce un número válido."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  is_active: z.boolean(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
