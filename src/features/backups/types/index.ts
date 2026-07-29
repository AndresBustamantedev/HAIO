import type { Database } from "@/types/database.types"

export type BackupConfiguration = Database["public"]["Tables"]["backup_configurations"]["Row"]
export type BackupRecord = Database["public"]["Tables"]["backup_records"]["Row"]

export type BackupConfigWithClient = BackupConfiguration & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
