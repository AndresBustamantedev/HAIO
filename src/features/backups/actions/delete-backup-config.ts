"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

/** Soft delete only — backup_configurations.deleted_at, never a physical DELETE. */
export async function deleteBackupConfig(configId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("backup_configurations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", configId)

  if (error) {
    return { error: "No se pudo eliminar la configuración de backup. " + error.message }
  }

  revalidatePath("/backups")

  return { error: null }
}
