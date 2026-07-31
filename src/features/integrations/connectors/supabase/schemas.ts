import { z } from 'zod'

const supabaseProjectStatusValues = [
  'ACTIVE_HEALTHY', 'ACTIVE_UNHEALTHY', 'COMING_UP', 'GOING_DOWN',
  'INACTIVE', 'INIT_FAILED', 'REMOVED', 'RESTORING', 'PAUSED',
] as const

export const supabaseProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization_id: z.string(),
  status: z.enum(supabaseProjectStatusValues).catch('ACTIVE_HEALTHY' as const),
  region: z.string().optional().default(''),
  created_at: z.string().optional().default(''),
  database: z.object({
    host: z.string(),
    version: z.string().optional().default(''),
  }).optional(),
})

export const supabaseProjectListSchema = z.array(supabaseProjectSchema)

export type SupabaseProjectRaw = z.infer<typeof supabaseProjectSchema>
