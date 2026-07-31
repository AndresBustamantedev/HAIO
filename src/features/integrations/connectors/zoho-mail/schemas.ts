import { z } from 'zod'

export const zohoMailAccountSchema = z.object({
  accountId: z.string(),
  accountName: z.string(),
  displayName: z.string().optional().default(''),
  incomingUserName: z.string().optional().default(''),
  mailCapacity: z.number().optional().default(0),
  mailUsed: z.number().optional().default(0),
  accountStatus: z.string().optional().default('active'),
  isPrimary: z.union([z.boolean(), z.number()]).transform(Boolean).optional().default(false),
})

export const zohoMailAccountsResponseSchema = z.object({
  status: z.object({ code: z.number(), description: z.string() }).optional(),
  data: z.array(zohoMailAccountSchema).optional().default([]),
})

export type ZohoMailAccountRaw = z.infer<typeof zohoMailAccountSchema>
