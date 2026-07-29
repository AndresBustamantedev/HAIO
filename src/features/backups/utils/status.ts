import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type BackupStatus = Database["public"]["Enums"]["backup_status"]

const BACKUP_STATUS_CONFIG: Record<BackupStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  pending: { label: "Pendiente", tone: "neutral" },
  running: { label: "En curso", tone: "info" },
  successful: { label: "Completado", tone: "success" },
  failed: { label: "Fallido", tone: "destructive" },
  cancelled: { label: "Cancelado", tone: "neutral" },
}

export function getBackupStatusBadge(status: BackupStatus) {
  return BACKUP_STATUS_CONFIG[status]
}
