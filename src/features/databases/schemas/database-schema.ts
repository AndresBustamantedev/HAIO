import { z } from "zod"

export const DATABASE_ENGINES = [
  "postgresql", "mysql", "mariadb", "sqlite",
  "mongodb", "redis", "mssql", "other",
] as const

export const DATABASE_STATUSES = ["active", "inactive", "migrating"] as const

export const databaseSchema = z.object({
  client_id:      z.string().uuid("Selecciona un cliente."),
  project_id:     z.string().uuid().optional().or(z.literal("")),
  name:           z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  engine:         z.enum(DATABASE_ENGINES),
  engine_version: z.string().trim().max(50).optional().or(z.literal("")),
  provider:       z.string().trim().max(100).optional().or(z.literal("")),
  host:           z.string().trim().max(300).optional().or(z.literal("")),
  status:         z.enum(DATABASE_STATUSES),
  notes:          z.string().trim().max(2000).optional().or(z.literal("")),
})

export type DatabaseInput = z.infer<typeof databaseSchema>
