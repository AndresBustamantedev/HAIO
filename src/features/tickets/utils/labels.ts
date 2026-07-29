import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type TicketStatus = Database["public"]["Enums"]["ticket_status"]
type TicketPriority = Database["public"]["Enums"]["ticket_priority"]

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  open: { label: "Abierto", tone: "info" },
  in_progress: { label: "En progreso", tone: "warning" },
  waiting_client: { label: "Espera cliente", tone: "warning" },
  waiting_internal: { label: "Espera interna", tone: "warning" },
  resolved: { label: "Resuelto", tone: "success" },
  closed: { label: "Cerrado", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "neutral" },
}

const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; tone: StatusBadgeProps["tone"] }> = {
  low: { label: "Baja", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "Alta", tone: "warning" },
  urgent: { label: "Urgente", tone: "destructive" },
}

export function getTicketStatusBadge(status: TicketStatus) {
  return TICKET_STATUS_CONFIG[status]
}

export function getTicketPriorityBadge(priority: TicketPriority) {
  return TICKET_PRIORITY_CONFIG[priority]
}
