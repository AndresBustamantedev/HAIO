import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type HostingStatus = Database["public"]["Enums"]["hosting_status"]

const HOSTING_STATUS_CONFIG: Record<HostingStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  pending: { label: "Pendiente", tone: "warning" },
  active: { label: "Activo", tone: "success" },
  suspended: { label: "Suspendido", tone: "destructive" },
  expired: { label: "Expirado", tone: "destructive" },
  cancelled: { label: "Cancelado", tone: "neutral" },
}

export function getHostingStatusBadge(status: HostingStatus) {
  return HOSTING_STATUS_CONFIG[status]
}
