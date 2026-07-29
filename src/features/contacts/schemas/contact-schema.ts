import { z } from "zod"

export const contactSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  full_name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  job_title: z.string().trim().max(150).optional().or(z.literal("")),
  department: z.string().trim().max(150).optional().or(z.literal("")),
  email: z.string().trim().email("Email no válido.").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  mobile: z.string().trim().max(50).optional().or(z.literal("")),
  is_primary: z.boolean(),
  receives_billing: z.boolean(),
  receives_support: z.boolean(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type ContactInput = z.infer<typeof contactSchema>
