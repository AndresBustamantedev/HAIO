import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type DomainStatus = Database["public"]["Enums"]["domain_status"]

const DOMAIN_STATUS_CONFIG: Record<DomainStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  pending: { label: "Pendiente", tone: "warning" },
  active: { label: "Activo", tone: "success" },
  expired: { label: "Expirado", tone: "destructive" },
  transferred: { label: "Transferido", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  unknown: { label: "Desconocido", tone: "neutral" },
}

export function getDomainStatusBadge(status: DomainStatus) {
  return DOMAIN_STATUS_CONFIG[status]
}
