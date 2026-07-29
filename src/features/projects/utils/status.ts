import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type ProjectStatus = Database["public"]["Enums"]["project_status"]
type ProjectType = Database["public"]["Enums"]["project_type"]

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  draft: { label: "Borrador", tone: "neutral" },
  planned: { label: "Planificado", tone: "info" },
  active: { label: "Activo", tone: "success" },
  on_hold: { label: "En pausa", tone: "warning" },
  completed: { label: "Completado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "destructive" },
  archived: { label: "Archivado", tone: "neutral" },
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  website: "Sitio web",
  ecommerce: "E-commerce",
  landing_page: "Landing page",
  maintenance: "Mantenimiento",
  redesign: "Rediseño",
  seo: "SEO",
  consulting: "Consultoría",
  other: "Otro",
}

export function getProjectStatusBadge(status: ProjectStatus) {
  return PROJECT_STATUS_CONFIG[status]
}

export function getProjectTypeLabel(type: ProjectType) {
  return PROJECT_TYPE_LABELS[type]
}
