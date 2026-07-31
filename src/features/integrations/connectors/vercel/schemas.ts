import { z } from 'zod'

export const vercelProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: z.string().nullable().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  link: z.object({
    type: z.string(),
    repo: z.string().optional(),
  }).optional(),
}).passthrough()

// v10/projects devuelve array directo (sin wrapper { projects, pagination })
export const vercelProjectsResponseSchema = z.array(vercelProjectSchema)

export const vercelDeploymentSchema = z.object({
  uid: z.string(),
  name: z.string(),
  url: z.string().nullable().optional(),
  // v7 usa readyState o state; aceptamos ambos
  state: z.string().optional(),
  readyState: z.string().optional(),
  createdAt: z.number().optional(),
  created: z.number().optional(),
  target: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

// v7/deployments devuelve { deployments: [...], pagination: {...} }
export const vercelDeploymentsResponseSchema = z.object({
  deployments: z.array(vercelDeploymentSchema),
  pagination: z.object({
    count: z.union([z.number(), z.string()]).optional(),
    next: z.union([z.number(), z.string()]).nullable().optional(),
    prev: z.union([z.number(), z.string()]).nullable().optional(),
  }).optional(),
})

export type VercelProjectRaw = z.infer<typeof vercelProjectSchema>
export type VercelDeploymentRaw = z.infer<typeof vercelDeploymentSchema>
