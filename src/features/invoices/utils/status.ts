import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"]

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  draft: { label: "Borrador", tone: "neutral" },
  issued: { label: "Emitida", tone: "info" },
  sent: { label: "Enviada", tone: "info" },
  viewed: { label: "Vista", tone: "info" },
  partially_paid: { label: "Pago parcial", tone: "warning" },
  paid: { label: "Pagada", tone: "success" },
  overdue: { label: "Vencida", tone: "destructive" },
  void: { label: "Anulada", tone: "neutral" },
  refunded: { label: "Reembolsada", tone: "neutral" },
}

export function getInvoiceStatusBadge(status: InvoiceStatus) {
  return INVOICE_STATUS_CONFIG[status]
}
