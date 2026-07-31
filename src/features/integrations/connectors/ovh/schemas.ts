import { z } from 'zod'

export const ovhDomainServiceInfoSchema = z.object({
  serviceId: z.number(),
  status: z.enum(['ok', 'expired', 'inCreation', 'unrenewed']),
  expiration: z.string(),
  renew: z.object({
    automatic: z.boolean(),
    period: z.number(),
  }).nullable().optional(),
})

export const ovhHostingInfoSchema = z.object({
  primaryLogin: z.string(),
  offer: z.string(),
  state: z.enum(['active', 'bloqued', 'maintenance']),
  hostingIp: z.string().nullable().optional(),
  cluster: z.string().nullable().optional(),
})

export type OvhDomainServiceInfoRaw = z.infer<typeof ovhDomainServiceInfoSchema>
export type OvhHostingInfoRaw = z.infer<typeof ovhHostingInfoSchema>
