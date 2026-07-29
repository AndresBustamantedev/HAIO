"use client"

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge, type StatusBadgeProps } from "@/components/common/status-badge"
import type { ProjectDetail } from "@/features/projects/queries/get-project-detail"
import type { Database } from "@/types/database.types"

type TaskStatus = Database["public"]["Enums"]["task_status"]

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  backlog: { label: "Backlog", tone: "neutral" },
  todo: { label: "Por hacer", tone: "info" },
  in_progress: { label: "En progreso", tone: "warning" },
  blocked: { label: "Bloqueada", tone: "destructive" },
  review: { label: "En revisión", tone: "info" },
  done: { label: "Hecha", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number | null, currency: string | null) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency ?? "EUR" }).format(
    value ?? 0
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center justify-between gap-3 py-2.5 text-sm">{children}</li>
}

function ProjectDetailTabs({ detail }: { detail: ProjectDetail }) {
  return (
    <Tabs defaultValue="tasks">
      <TabsList className="flex-wrap">
        <TabsTrigger value="tasks">Tareas ({detail.tasks.length})</TabsTrigger>
        <TabsTrigger value="services">Servicios ({detail.services.length})</TabsTrigger>
        <TabsTrigger value="documents">Documentos ({detail.documents.length})</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
      </TabsList>

      <TabsPanel value="tasks">
        {detail.tasks.length === 0 ? (
          <EmptyState title="Sin tareas" description="Este proyecto todavía no tiene tareas registradas." />
        ) : (
          <ul className="divide-y">
            {detail.tasks.map((task) => {
              const config = TASK_STATUS_CONFIG[task.status]
              return (
                <Row key={task.id}>
                  <span className="font-medium text-foreground">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={config.tone} label={config.label} />
                    <span className="text-muted-foreground">{formatDate(task.due_date)}</span>
                  </div>
                </Row>
              )
            })}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="services">
        {detail.services.length === 0 ? (
          <EmptyState title="Sin servicios" description="No hay servicios asociados a este proyecto." />
        ) : (
          <ul className="divide-y">
            {detail.services.map((service) => (
              <Row key={service.id}>
                <span className="font-medium text-foreground">{service.services?.name ?? "Servicio"}</span>
                <span className="text-muted-foreground">{formatCurrency(service.unit_price, service.currency_code)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="documents">
        {detail.documents.length === 0 ? (
          <EmptyState title="Sin documentos" description="No hay documentos visibles todavía." />
        ) : (
          <ul className="divide-y">
            {detail.documents.map((document) => (
              <Row key={document.id}>
                <span className="font-medium text-foreground">{document.title}</span>
                <span className="text-muted-foreground">{formatDate(document.created_at)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="activity">
        {detail.activity.length === 0 ? (
          <EmptyState title="Sin actividad reciente" />
        ) : (
          <ul className="divide-y">
            {detail.activity.map((entry) => (
              <Row key={entry.id}>
                <span className="text-foreground">{entry.summary}</span>
                <span className="text-muted-foreground">{formatDate(entry.created_at)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>
    </Tabs>
  )
}

export { ProjectDetailTabs }
