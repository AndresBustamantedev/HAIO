import { z } from 'zod'

export const ms365DomainSchema = z.object({
  id: z.string(),
  isDefault: z.boolean().optional().default(false),
  isVerified: z.boolean().optional().default(false),
  isInitial: z.boolean().optional().default(false),
  authenticationType: z.string().optional().default('Managed'),
})

export const ms365DomainsResponseSchema = z.object({
  value: z.array(ms365DomainSchema).optional().default([]),
  '@odata.nextLink': z.string().optional(),
})

export const ms365UserSchema = z.object({
  id: z.string(),
  displayName: z.string().optional().default(''),
  userPrincipalName: z.string(),
  mail: z.string().nullable().optional(),
  accountEnabled: z.boolean().optional().default(true),
  createdDateTime: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
})

export const ms365UsersResponseSchema = z.object({
  value: z.array(ms365UserSchema).optional().default([]),
  '@odata.nextLink': z.string().optional(),
})

export type Ms365DomainRaw = z.infer<typeof ms365DomainSchema>
export type Ms365UserRaw   = z.infer<typeof ms365UserSchema>
