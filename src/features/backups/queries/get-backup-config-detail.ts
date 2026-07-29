import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { BackupConfigWithClient, BackupRecord } from "@/features/backups/types"

export type BackupConfigDetail = {
  config: BackupConfigWithClient
  records: BackupRecord[]
}

export async function getBackupConfigDetail(configId: string): Promise<BackupConfigDetail | null> {
  const supabase = await createClient()

  const configRes = await supabase
    .from("backup_configurations")
    .select("*, clients(id, display_name)")
    .eq("id", configId)
    .is("deleted_at", null)
    .maybeSingle()

  if (configRes.error || !configRes.data) {
    return null
  }

  const recordsRes = await supabase
    .from("backup_records")
    .select("*")
    .eq("backup_configuration_id", configId)
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(30)

  return {
    config: configRes.data as BackupConfigWithClient,
    records: recordsRes.data ?? [],
  }
}
