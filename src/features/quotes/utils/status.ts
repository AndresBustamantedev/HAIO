import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type QuoteStatus = Database["public"]["Enums"]["quote_status"]

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  draft: { label: "Borrador", tone: "neutral" },
  sent: { label: "Enviado", tone: "info" },
  viewed: { label: "Visto", tone: "info" },
  accepted: { label: "Aceptado", tone: "success" },
  rejected: { label: "Rechazado", tone: "destructive" },
  expired: { label: "Expirado", tone: "warning" },
  cancelled: { label: "Cancelado", tone: "neutral" },
}

export function getQuoteStatusBadge(status: QuoteStatus) {
  return QUOTE_STATUS_CONFIG[status]
}
