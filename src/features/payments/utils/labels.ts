import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type PaymentMethod = Database["public"]["Enums"]["payment_method_type"]
type PaymentStatus = Database["public"]["Enums"]["payment_status"]

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Transferencia",
  card: "Tarjeta",
  cash: "Efectivo",
  paypal: "PayPal",
  stripe: "Stripe",
  direct_debit: "Domiciliación",
  other: "Otro",
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  pending: { label: "Pendiente", tone: "warning" },
  processing: { label: "Procesando", tone: "info" },
  succeeded: { label: "Completado", tone: "success" },
  failed: { label: "Fallido", tone: "destructive" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  refunded: { label: "Reembolsado", tone: "neutral" },
  partially_refunded: { label: "Reembolso parcial", tone: "warning" },
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method]
}

export function getPaymentStatusBadge(status: PaymentStatus) {
  return PAYMENT_STATUS_CONFIG[status]
}
