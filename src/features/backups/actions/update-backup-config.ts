"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { backupConfigSchema, type BackupConfigInput } from "@/features/backups/schemas/backup-config-schema"

type ActionResult = { error: string | null }

export async function updateBackupConfig(configId: string, input: BackupConfigInput): Promise<ActionResult> {
  const parsed = backupConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("backup_configurations")
    .update({
      name: parsed.data.name,
      provider_name: parsed.data.provider_name,
      frequency: parsed.data.frequency,
      retention_days: Number(parsed.data.retention_days),
      status: parsed.data.status,
      client_id: parsed.data.client_id || null,
    })
    .eq("id", configId)

  if (error) {
    return { error: "No se pudo actualizar la configuración de backup. " + error.message }
  }

  revalidatePath("/backups")
  revalidatePath(`/backups/${configId}`)

  return { error: null }
}
