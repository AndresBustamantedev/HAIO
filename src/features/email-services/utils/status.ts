import type { StatusBadgeProps } from "@/components/common/status-badge"
import type { EMAIL_SERVICE_STATUSES } from "@/features/email-services/schemas/email-service-schema"

type EmailServiceStatus = (typeof EMAIL_SERVICE_STATUSES)[number]

const EMAIL_SERVICE_STATUS_CONFIG: Record<EmailServiceStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  pending: { label: "Pendiente", tone: "warning" },
  active: { label: "Activo", tone: "success" },
  suspended: { label: "Suspendido", tone: "destructive" },
  expired: { label: "Expirado", tone: "destructive" },
  cancelled: { label: "Cancelado", tone: "neutral" },
}

export function getEmailServiceStatusBadge(status: EmailServiceStatus) {
  return EMAIL_SERVICE_STATUS_CONFIG[status]
}
