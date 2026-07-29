import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type ServiceCategory = Database["public"]["Enums"]["service_category"]
type ServiceBillingType = Database["public"]["Enums"]["service_billing_type"]

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  development: "Desarrollo",
  design: "Diseño",
  hosting: "Hosting",
  domain: "Dominios",
  email: "Correo",
  maintenance: "Mantenimiento",
  seo: "SEO",
  analytics: "Analítica",
  support: "Soporte",
  consulting: "Consultoría",
  other: "Otro",
}

const BILLING_TYPE_CONFIG: Record<ServiceBillingType, { label: string; tone: StatusBadgeProps["tone"] }> = {
  one_time: { label: "Pago único", tone: "neutral" },
  recurring: { label: "Recurrente", tone: "info" },
  usage_based: { label: "Por uso", tone: "warning" },
  free: { label: "Gratuito", tone: "success" },
}

export function getServiceCategoryLabel(category: ServiceCategory) {
  return CATEGORY_LABELS[category]
}

export function getServiceBillingTypeBadge(type: ServiceBillingType) {
  return BILLING_TYPE_CONFIG[type]
}
