import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type ClientStatus = Database["public"]["Enums"]["client_status"]

const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  lead: { label: "Lead", tone: "info" },
  prospect: { label: "Prospecto", tone: "warning" },
  active: { label: "Activo", tone: "success" },
  inactive: { label: "Inactivo", tone: "neutral" },
  archived: { label: "Archivado", tone: "neutral" },
}

export function getClientStatusBadge(status: ClientStatus) {
  return CLIENT_STATUS_CONFIG[status]
}
