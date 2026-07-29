import { z } from "zod"

export const CLIENT_TYPES = ["individual", "company", "association", "other"] as const
export const CLIENT_STATUSES = ["lead", "prospect", "active", "inactive", "archived"] as const

export const clientSchema = z.object({
  display_name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  type: z.enum(CLIENT_TYPES),
  status: z.enum(CLIENT_STATUSES),
  legal_name: z.string().trim().max(200).optional().or(z.literal("")),
  tax_id: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Email no válido.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type ClientInput = z.infer<typeof clientSchema>
