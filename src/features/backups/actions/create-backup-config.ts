"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { backupConfigSchema, type BackupConfigInput } from "@/features/backups/schemas/backup-config-schema"

type ActionResult = { error: string | null }

export async function createBackupConfig(input: BackupConfigInput): Promise<ActionResult> {
  const parsed = backupConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("backup_configurations").insert({
    organization_id: organization.organizationId,
    name: parsed.data.name,
    provider_name: parsed.data.provider_name,
    frequency: parsed.data.frequency,
    retention_days: Number(parsed.data.retention_days),
    status: parsed.data.status,
    client_id: parsed.data.client_id || null,
  })

  if (error) {
    return { error: "No se pudo crear la configuración de backup. " + error.message }
  }

  revalidatePath("/backups")

  return { error: null }
}
