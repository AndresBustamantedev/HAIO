import { z } from "zod"

export const profileSchema = z.object({
  first_name: z.string().trim().max(100).optional().or(z.literal("")),
  last_name: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  timezone: z.string().trim().min(1, "La zona horaria es obligatoria."),
  locale: z.string().trim().min(1, "El idioma es obligatorio."),
})

export type ProfileInput = z.infer<typeof profileSchema>
