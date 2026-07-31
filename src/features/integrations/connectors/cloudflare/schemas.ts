import { z } from 'zod'

export const cloudflareZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'pending', 'initializing', 'moved', 'deleted', 'deactivated']),
  paused: z.boolean(),
  type: z.enum(['full', 'partial', 'secondary']),
  name_servers: z.array(z.string()).default([]),
  original_name_servers: z.array(z.string()).nullable().optional(),
  created_on: z.string(),
  modified_on: z.string(),
  account: z.object({ id: z.string(), name: z.string() }),
  plan: z.object({ name: z.string() }).optional(),
})

export const cloudflareZonesResponseSchema = z.object({
  result: z.array(cloudflareZoneSchema),
  result_info: z.object({
    page: z.number(),
    per_page: z.number(),
    total_pages: z.number(),
    count: z.number(),
    total_count: z.number(),
  }).optional(),
  success: z.boolean(),
  errors: z.array(z.object({ code: z.number(), message: z.string() })),
})

export const cloudflareTokenVerifySchema = z.object({
  result: z.object({
    id: z.string(),
    status: z.enum(['active', 'disabled', 'expired']),
  }),
  success: z.boolean(),
  errors: z.array(z.object({ code: z.number(), message: z.string() })),
})

export type CloudflareZoneRaw = z.infer<typeof cloudflareZoneSchema>
