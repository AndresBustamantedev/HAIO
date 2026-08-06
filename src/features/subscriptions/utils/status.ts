import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]

const SUBSCRIPTION_STATUS_CONFIG: Record<SubscriptionStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  trialing: { label: "En prueba", tone: "info" },
  active: { label: "Activa", tone: "success" },
  past_due: { label: "Pago atrasado", tone: "destructive" },
  paused: { label: "Pausada", tone: "warning" },
  cancelled: { label: "Cancelada", tone: "neutral" },
  expired: { label: "Expirada", tone: "neutral" },
}

export function getSubscriptionStatusBadge(status: SubscriptionStatus) {
  return SUBSCRIPTION_STATUS_CONFIG[status]
}

const INTERVAL_LABELS: Record<Database["public"]["Enums"]["billing_interval"], string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  biennial: "Bienal",
  custom: "Personalizado",
}

export function getBillingIntervalLabel(interval: Database["public"]["Enums"]["billing_interval"]) {
  return INTERVAL_LABELS[interval]
}
