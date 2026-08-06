import { z } from "zod"

export const REPOSITORY_STATUSES = ["active", "archived", "deleted"] as const
export const REPOSITORY_VISIBILITIES = ["private", "public"] as const

export const repositorySchema = z.object({
  client_id:  z.string().uuid("Selecciona un cliente."),
  project_id: z.string().uuid().optional().or(z.literal("")),
  name:       z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  provider:   z.string().trim().max(100).optional().or(z.literal("")),
  url:        z.string().trim().max(500).optional().or(z.literal("")),
  visibility: z.enum(REPOSITORY_VISIBILITIES).optional(),
  status:     z.enum(REPOSITORY_STATUSES),
  notes:      z.string().trim().max(2000).optional().or(z.literal("")),
})

export type RepositoryInput = z.infer<typeof repositorySchema>
