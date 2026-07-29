import { z } from "zod"

export const BACKUP_STATUSES = ["pending", "running", "successful", "failed", "cancelled"] as const

export const backupConfigSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  provider_name: z.string().trim().min(1, "El proveedor es obligatorio.").max(150),
  frequency: z.string().trim().min(1, "La frecuencia es obligatoria.").max(50),
  retention_days: z
    .string()
    .trim()
    .min(1, "La retención es obligatoria.")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Introduce un número válido."),
  status: z.enum(BACKUP_STATUSES),
  client_id: z.string().uuid().optional().or(z.literal("")),
})

export type BackupConfigInput = z.infer<typeof backupConfigSchema>
