import { z } from 'zod'

/**
 * Schemas Zod para validar las respuestas de la API de GoDaddy.
 * Validar siempre antes de mapear para detectar cambios en la API.
 */

export const goDaddyDomainSchema = z.object({
  domainId: z.number(),
  domain: z.string().min(1),
  status: z.string(),
  expires: z.string().nullable().optional(),
  renewAuto: z.boolean().default(false),
  renewDeadline: z.string().nullable().optional(),
  createdAt: z.string(),
  registrar: z.string().optional(),
  nameServers: z.array(z.string()).nullable().optional(),
  contactRegistrant: z
    .object({ email: z.string().optional() })
    .optional(),
})

export const goDaddyDomainsListSchema = z.array(goDaddyDomainSchema)

export const goDaddyErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        path: z.string(),
      }),
    )
    .optional(),
})

export type GoDaddyDomainRaw = z.infer<typeof goDaddyDomainSchema>
export type GoDaddyDomainsListRaw = z.infer<typeof goDaddyDomainsListSchema>
