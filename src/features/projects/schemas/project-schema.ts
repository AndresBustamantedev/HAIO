import { z } from "zod"

export const PROJECT_TYPES = [
  "website",
  "ecommerce",
  "landing_page",
  "maintenance",
  "redesign",
  "seo",
  "consulting",
  "other",
] as const

export const PROJECT_STATUSES = [
  "draft",
  "planned",
  "active",
  "on_hold",
  "completed",
  "cancelled",
  "archived",
] as const

export const projectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  client_id: z.string().uuid("Selecciona un cliente."),
  type: z.enum(PROJECT_TYPES),
  status: z.enum(PROJECT_STATUSES),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  budget: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), "Introduce un número válido."),
  start_date: z.string().trim().optional().or(z.literal("")),
  target_date: z.string().trim().optional().or(z.literal("")),
  repository_url: z.string().trim().max(300).optional().or(z.literal("")),
  production_url: z.string().trim().max(300).optional().or(z.literal("")),
})

export type ProjectInput = z.infer<typeof projectSchema>
