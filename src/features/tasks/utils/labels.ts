import type { Database } from "@/types/database.types"
import type { StatusBadgeProps } from "@/components/common/status-badge"

type TaskStatus = Database["public"]["Enums"]["task_status"]
type TaskPriority = Database["public"]["Enums"]["task_priority"]

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  backlog: { label: "Backlog", tone: "neutral" },
  todo: { label: "Por hacer", tone: "info" },
  in_progress: { label: "En progreso", tone: "warning" },
  blocked: { label: "Bloqueada", tone: "destructive" },
  review: { label: "En revisión", tone: "info" },
  done: { label: "Hecha", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
}

const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; tone: StatusBadgeProps["tone"] }> = {
  low: { label: "Baja", tone: "neutral" },
  medium: { label: "Media", tone: "info" },
  high: { label: "Alta", tone: "warning" },
  urgent: { label: "Urgente", tone: "destructive" },
}

export function getTaskStatusBadge(status: TaskStatus) {
  return TASK_STATUS_CONFIG[status]
}

export function getTaskPriorityBadge(priority: TaskPriority) {
  return TASK_PRIORITY_CONFIG[priority]
}
