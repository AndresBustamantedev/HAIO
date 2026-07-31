import { z } from 'zod'

export const porkbunDomainSchema = z.object({
  domain: z.string(),
  status: z.string(),
  tld: z.string(),
  createDate: z.string(),
  expireDate: z.string(),
  securityLock: z.string().optional().default('0'),
  whoisPrivacy: z.string().optional().default('0'),
  autoRenew: z.string().optional().default('0'),
  notLocal: z.string().optional().default('0'),
})

export const porkbunDomainListResponseSchema = z.object({
  status: z.string(),
  domains: z.array(porkbunDomainSchema).optional().default([]),
})

export const porkbunPingResponseSchema = z.object({
  status: z.string(),
  yourIp: z.string().optional(),
})

export type PorkbunDomainRaw = z.infer<typeof porkbunDomainSchema>
