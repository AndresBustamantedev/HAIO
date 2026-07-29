import { z } from "zod"

export const organizationSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  legal_name: z.string().trim().max(200).optional().or(z.literal("")),
  tax_id: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("Email no válido.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  address_line_1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  country_code: z.string().trim().min(2).max(2),
  currency_code: z.string().trim().min(3).max(3),
  timezone: z.string().trim().min(1, "La zona horaria es obligatoria."),
})

export type OrganizationInput = z.infer<typeof organizationSchema>
