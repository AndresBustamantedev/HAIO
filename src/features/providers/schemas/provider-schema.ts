import { z } from "zod"
import { PROVIDER_CATEGORIES } from "@/features/providers/utils/labels"

export const providerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  category: z.enum(PROVIDER_CATEGORIES as [string, ...string[]]),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  support_url: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type ProviderInput = z.infer<typeof providerSchema>

export const providerAccountSchema = z.object({
  provider_id: z.string().uuid("Selecciona un proveedor."),
  label: z.string().trim().min(1, "El nombre de cuenta es obligatorio.").max(200),
  account_reference: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type ProviderAccountInput = z.infer<typeof providerAccountSchema>
